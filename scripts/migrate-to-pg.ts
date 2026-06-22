#!/usr/bin/env tsx
/**
 * Data migration: MDX/YAML/SQLite → PostgreSQL
 *
 * Usage:
 *   DRY_RUN=1   tsx scripts/migrate-to-pg.ts          # dry-run (parse but don't insert)
 *   tsx scripts/migrate-to-pg.ts                       # real run
 *   ONLY=posts  tsx scripts/migrate-to-pg.ts           # partial migration
 *
 * Prerequisites: PostgreSQL database + schema already created.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";
import yaml from "js-yaml";
import Database from "better-sqlite3";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// ── Config ────────────────────────────────────────────────────────
const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const ONLY = process.env.ONLY?.split(",") || null; // e.g. ONLY=posts,categories

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://blog:blog_dev_2026@localhost:5432/micro_ai_blog";

const CONTENT_DIR = path.join(ROOT, "content");
const DATA_DIR = path.join(ROOT, "data");
const SQLITE_PATH = path.join(DATA_DIR, "blog.db");

function shouldRun(name: string): boolean {
  return !ONLY || ONLY.includes(name);
}

// ── Postgres client ───────────────────────────────────────────────
const pgPool = new pg.Pool({ connectionString: DATABASE_URL });

async function pgQuery(text: string, params?: unknown[]) {
  if (DRY_RUN) {
    console.log(`  [DRY-RUN] ${text.slice(0, 80)}...`);
    return { rows: [], rowCount: 0 };
  }
  return pgPool.query(text, params);
}

// ── Slugify ───────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w一-鿿\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// ── Stats ─────────────────────────────────────────────────────────
const stats: Record<string, number> = {};
function count(table: string, n: number) {
  stats[table] = (stats[table] || 0) + n;
}

// ── 1. Authors ────────────────────────────────────────────────────
async function migrateAuthors() {
  if (!shouldRun("authors")) return;
  console.log("\n📦 Migrating authors...");
  const dir = path.join(CONTENT_DIR, "authors");
  if (!fs.existsSync(dir)) return;

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".yaml"))) {
    const data = yaml.load(fs.readFileSync(path.join(dir, file), "utf-8")) as any;
    await pgQuery(
      `INSERT INTO authors (slug, name, avatar, bio)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name=$2, avatar=$3, bio=$4`,
      [data.id || slugify(data.name), data.name, data.avatar || null, data.bio || null]
    );
    count("authors", 1);
  }
}

// ── 2. Categories ─────────────────────────────────────────────────
async function migrateCategories() {
  if (!shouldRun("categories")) return;
  console.log("\n📦 Migrating categories...");
  const file = path.join(CONTENT_DIR, "categories.yaml");
  if (!fs.existsSync(file)) return;

  const cats = yaml.load(fs.readFileSync(file, "utf-8")) as any[];
  for (let i = 0; i < cats.length; i++) {
    const c = cats[i];
    const slug = slugify(c.name);
    await pgQuery(
      `INSERT INTO categories (slug, name, description, background, bg_opacity, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE SET name=$2, description=$3, background=$4, bg_opacity=$5, sort_order=$6`,
      [slug, c.name, c.description || null, c.background || null, c.bgOpacity ?? 15, i]
    );
    count("categories", 1);
  }
}

// ── 3. Blog posts + notes ─────────────────────────────────────────
async function migratePosts() {
  if (!shouldRun("posts")) return;
  console.log("\n📦 Migrating blog posts + notes...");
  const dir = path.join(CONTENT_DIR, "blog");
  if (!fs.existsSync(dir)) return;

  // Pre-load category ID map
  const catResult = await pgPool.query("SELECT id, slug FROM categories");
  const catBySlug = new Map<string, number>();
  if (!DRY_RUN) {
    for (const row of catResult.rows) {
      catBySlug.set(row.slug, row.id);
    }
  }

  // Pre-load author ID
  const authorResult = await pgPool.query("SELECT id FROM authors LIMIT 1");
  const defaultAuthorId = !DRY_RUN && authorResult.rows.length > 0 ? authorResult.rows[0].id : null;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data: fm, content } = matter(raw);

    const slug = file.replace(/\.(md|mdx)$/, "");
    const kind = fm.type === "note" ? "note" : "post";
    const title = fm.title || slug;
    const summary = fm.summary || null;
    const cover = fm.cover || null;
    const draft = fm.draft === true;
    const date = fm.date ? new Date(fm.date).toISOString() : new Date().toISOString();
    const mood = fm.mood || null;
    const location = fm.location || null;

    // Category
    const catSlug = fm.category ? slugify(fm.category) : null;
    const categoryId = catSlug && catBySlug.get(catSlug) ? catBySlug.get(catSlug) : null;

    // Word count (CJK-aware approximation)
    const wordCount = content.replace(/\s/g, "").length;
    const readingMins = Math.max(1, Math.round(wordCount / 400));

    // Insert post
    const postResult = await pgQuery(
      `INSERT INTO posts (slug, kind, title, content_md, summary, cover, draft, mood, location,
                          author_id, category_id, word_count, reading_mins, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (slug) DO UPDATE SET
         title=$3, content_md=$4, summary=$5, cover=$6, draft=$7, mood=$8, location=$9,
         category_id=$11, word_count=$12, reading_mins=$13, published_at=$14, updated_at=NOW()
       RETURNING id`,
      [slug, kind, title, content, summary, cover, draft, mood, location,
       defaultAuthorId, categoryId, wordCount, readingMins, date]
    );
    const postId = !DRY_RUN ? postResult.rows[0].id : 0;
    count("posts", 1);

    // Tags
    const tagNames: string[] = Array.isArray(fm.tags) ? fm.tags : [];
    for (const tagName of tagNames) {
      if (!tagName) continue;
      const tagResult = await pgQuery(
        `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`,
        [tagName]
      );
      const tagId = !DRY_RUN
        ? tagResult.rows.length > 0
          ? tagResult.rows[0].id
          : (await pgPool.query("SELECT id FROM tags WHERE name=$1", [tagName])).rows[0].id
        : 0;
      await pgQuery(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, tagId]
      );
      count("tags", 1);
    }

    // Note images (from frontmatter images array)
    if (kind === "note" && Array.isArray(fm.images)) {
      for (let i = 0; i < fm.images.length; i++) {
        const img = fm.images[i];
        const src = typeof img === "string" ? img : img.src;
        const alt = typeof img === "string" ? null : img.alt || null;
        await pgQuery(
          `INSERT INTO note_images (post_id, src, alt, position) VALUES ($1, $2, $3, $4)`,
          [postId, src, alt, i]
        );
        count("note_images", 1);
      }
    }
  }
}

// ── 4. Chatters ───────────────────────────────────────────────────
async function migrateChatters() {
  if (!shouldRun("chatters")) return;
  console.log("\n📦 Migrating chatters...");
  const dir = path.join(CONTENT_DIR, "chatters");
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf-8");
    const { data: fm, content } = matter(raw);

    const slug = fm.slug || file.replace(/\.(md|mdx)$/, "");
    const title = fm.title || slug;
    const summary = fm.summary || null;
    const cover = fm.cover || null;
    const mood = fm.mood || null;
    const draft = fm.draft === true;
    const date = fm.date ? new Date(fm.date).toISOString() : new Date().toISOString();

    const wordCount = content.replace(/\s/g, "").length;
    const readingMins = Math.max(1, Math.round(wordCount / 400));

    await pgQuery(
      `INSERT INTO posts (slug, kind, title, content_md, summary, cover, draft, mood,
                          word_count, reading_mins, published_at)
       VALUES ($1, 'chatter', $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (slug) DO UPDATE SET
         title=$2, content_md=$3, summary=$4, cover=$5, draft=$6, mood=$7,
         word_count=$8, reading_mins=$9, published_at=$10, updated_at=NOW()`,
      [slug, title, content, summary, cover, draft, mood, wordCount, readingMins, date]
    );
    count("chatters", 1);

    // Tags
    const tagNames: string[] = Array.isArray(fm.tags) ? fm.tags : [];
    const postResult = await pgPool.query("SELECT id FROM posts WHERE slug=$1", [slug]);
    const postId = !DRY_RUN ? postResult.rows[0]?.id : 0;
    for (const tagName of tagNames) {
      if (!tagName) continue;
      const tagResult = await pgQuery(
        `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`,
        [tagName]
      );
      const tagId = !DRY_RUN
        ? tagResult.rows.length > 0
          ? tagResult.rows[0].id
          : (await pgPool.query("SELECT id FROM tags WHERE name=$1", [tagName])).rows[0].id
        : 0;
      await pgQuery(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [postId, tagId]
      );
    }
  }
}

// ── 5. Projects ───────────────────────────────────────────────────
async function migrateProjects() {
  if (!shouldRun("projects")) return;
  console.log("\n📦 Migrating projects...");
  const file = path.join(CONTENT_DIR, "projects", "projects.yaml");
  if (!fs.existsSync(file)) return;

  const projects = yaml.load(fs.readFileSync(file, "utf-8")) as any[];
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const details = p.details || {};
    await pgQuery(
      `INSERT INTO projects (slug, name, description, tech_stack, github_url, demo_url,
                              highlights, background, problem, solution, results,
                              related_posts, code_index_enabled, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (slug) DO UPDATE SET
         name=$2, description=$3, tech_stack=$4, github_url=$5, demo_url=$6,
         highlights=$7, background=$8, problem=$9, solution=$10, results=$11,
         related_posts=$12, code_index_enabled=$13, sort_order=$14, updated_at=NOW()`,
      [
        p.slug,
        p.name,
        p.description || null,
        JSON.stringify(p.techStack || []),
        p.githubUrl || null,
        p.demoUrl || null,
        JSON.stringify(p.highlights || []),
        details.background || null,
        details.problem || null,
        details.solution || null,
        details.results || null,
        JSON.stringify(p.relatedPosts || []),
        p.codeIndex?.enabled ?? false,
        i,
      ]
    );
    count("projects", 1);
  }
}

// ── 6. Friends ────────────────────────────────────────────────────
async function migrateFriends() {
  if (!shouldRun("friends")) return;
  console.log("\n📦 Migrating friends...");
  const file = path.join(CONTENT_DIR, "friends.yaml");
  if (!fs.existsSync(file)) return;

  const data = yaml.load(fs.readFileSync(file, "utf-8")) as any;
  const list = Array.isArray(data) ? data : data.friends || [];
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    await pgQuery(
      `INSERT INTO friends (name, url, description, avatar, theme_color, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [f.name, f.url, f.description || null, f.avatar || null, f.themeColor || "rgba(99,102,241,0.5)", i]
    );
    count("friends", 1);
  }
}

// ── 7. Gallery ────────────────────────────────────────────────────
async function migrateGallery() {
  if (!shouldRun("gallery")) return;
  console.log("\n📦 Migrating gallery...");
  const file = path.join(CONTENT_DIR, "gallery.yaml");
  if (!fs.existsSync(file)) return;

  const data = yaml.load(fs.readFileSync(file, "utf-8")) as any;
  const photos = Array.isArray(data) ? data : data.photos || [];
  for (let i = 0; i < photos.length; i++) {
    const p = photos[i];
    await pgQuery(
      `INSERT INTO gallery_photos (src, title, date, location, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [p.src, p.title || null, p.date || null, p.location || null, i]
    );
    count("gallery_photos", 1);
  }
  if (photos.length === 0) {
    console.log("  (no photos in gallery.yaml)");
  }
}

// ── 8. About profile ──────────────────────────────────────────────
async function migrateAbout() {
  if (!shouldRun("about")) return;
  console.log("\n📦 Migrating about profile...");
  const file = path.join(CONTENT_DIR, "about", "profile.yaml");
  if (!fs.existsSync(file)) return;

  const data = yaml.load(fs.readFileSync(file, "utf-8")) as any;
  await pgQuery(
    `INSERT INTO site_profile (id, name, avatar, bio, bio2, email, github, tagline, skills, tech_stack)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       name=$1, avatar=$2, bio=$3, bio2=$4, email=$5, github=$6, tagline=$7,
       skills=$8, tech_stack=$9, updated_at=NOW()`,
    [
      data.name,
      data.avatar || null,
      data.bio || null,
      data.bio2 || null,
      data.email || null,
      data.github || null,
      data.tagline || null,
      JSON.stringify(data.skills || []),
      JSON.stringify(data.techStack || []),
    ]
  );
  count("site_profile", 1);
}

// ── 9. SQLite → PostgreSQL (analytics + auth) ─────────────────────
async function migrateSQLite() {
  if (!shouldRun("sqlite")) return;
  if (!fs.existsSync(SQLITE_PATH)) {
    console.log("\n📦 No SQLite DB found, skipping...");
    return;
  }
  console.log("\n📦 Migrating SQLite → PostgreSQL...");

  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  // path_stats
  const pathStatsRows = sqlite.prepare("SELECT * FROM path_stats").all() as any[];
  for (const row of pathStatsRows) {
    await pgQuery(
      `INSERT INTO path_stats (path, pv, uv, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (path) DO UPDATE SET pv=$2, uv=$3, updated_at=$4`,
      [row.path, row.pv, row.uv, row.updated_at]
    );
    count("path_stats", 1);
  }

  // path_visitors
  const pathVisitorsRows = sqlite.prepare("SELECT * FROM path_visitors").all() as any[];
  for (const row of pathVisitorsRows) {
    await pgQuery(
      `INSERT INTO path_visitors (path, visitor_id)
       VALUES ($1, $2)
       ON CONFLICT (path, visitor_id) DO NOTHING`,
      [row.path, row.visitor_id]
    );
    count("path_visitors", 1);
  }

  // page_view_events
  const pveRows = sqlite.prepare("SELECT * FROM page_view_events").all() as any[];
  for (const row of pveRows) {
    await pgQuery(
      `INSERT INTO page_view_events (path, visitor_id, viewed_at)
       VALUES ($1, $2, $3)`,
      [row.path, row.visitor_id, row.viewed_at]
    );
    count("page_view_events", 1);
  }

  // likes
  const likesRows = sqlite.prepare("SELECT * FROM likes").all() as any[];
  for (const row of likesRows) {
    await pgQuery(
      `INSERT INTO likes (slug, count, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET count=$2, updated_at=$3`,
      [row.slug, row.count, row.updated_at]
    );
    count("likes", 1);
  }

  // like_voters
  const lvRows = sqlite.prepare("SELECT * FROM like_voters").all() as any[];
  for (const row of lvRows) {
    await pgQuery(
      `INSERT INTO like_voters (slug, visitor_id)
       VALUES ($1, $2)
       ON CONFLICT (slug, visitor_id) DO NOTHING`,
      [row.slug, row.visitor_id]
    );
    count("like_voters", 1);
  }

  // auth_kv
  const authRows = sqlite.prepare("SELECT * FROM auth_kv").all() as any[];
  for (const row of authRows) {
    await pgQuery(
      `INSERT INTO auth_kv (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value=$2`,
      [row.key, String(row.value)]
    );
    count("auth_kv", 1);
  }

  // login_attempts (convert ms timestamps → TIMESTAMPTZ)
  const laRows = sqlite.prepare("SELECT * FROM login_attempts").all() as any[];
  for (const row of laRows) {
    await pgQuery(
      `INSERT INTO login_attempts (ip_hash, fail_count, locked_until, window_start)
       VALUES ($1, $2, to_timestamp($3::bigint / 1000.0), to_timestamp($4::bigint / 1000.0))
       ON CONFLICT (ip_hash) DO UPDATE SET fail_count=$2, locked_until=to_timestamp($3::bigint / 1000.0), window_start=to_timestamp($4::bigint / 1000.0)`,
      [row.ip, row.fail_count, row.locked_until, row.window_start]
    );
    count("login_attempts", 1);
  }

  sqlite.close();
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀 Migration ${DRY_RUN ? "(DRY-RUN)" : "(LIVE)"} starting...`);
  if (ONLY) console.log(`   Only: ${ONLY.join(", ")}`);

  try {
    await migrateAuthors();
    await migrateCategories();
    await migratePosts();
    await migrateChatters();
    await migrateProjects();
    await migrateFriends();
    await migrateGallery();
    await migrateAbout();
    await migrateSQLite();

    console.log("\n✅ Migration complete!\n");
    console.log("   Summary:");
    for (const [table, n] of Object.entries(stats)) {
      console.log(`     ${table}: ${n}`);
    }

    // Verification: compare PG counts
    if (!DRY_RUN) {
      console.log("\n📊 PostgreSQL row counts:");
      const tables = [
        "authors", "categories", "posts", "tags", "post_tags", "note_images",
        "projects", "friends", "gallery_photos", "site_profile",
        "path_stats", "path_visitors", "page_view_events", "likes", "like_voters",
        "auth_kv", "login_attempts",
      ];
      for (const t of tables) {
        const result = await pgPool.query(`SELECT COUNT(*) FROM ${t}`);
        console.log(`     ${t}: ${result.rows[0].count}`);
      }
    }
  } catch (err) {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await pgPool.end();
  }
}

main();
