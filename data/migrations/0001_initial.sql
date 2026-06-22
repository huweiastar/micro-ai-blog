-- micro-ai-blog PostgreSQL schema
-- Run: psql -U blog -d micro_ai_blog -f data/migrations/0001_initial.sql

-- ============================================================
-- 1. Content tables
-- ============================================================

-- Authors
CREATE TABLE IF NOT EXISTS authors (
  id         SERIAL PRIMARY KEY,
  slug       TEXT UNIQUE NOT NULL,
  name       TEXT NOT NULL,
  avatar     TEXT,
  bio        TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id          SERIAL PRIMARY KEY,
  name        TEXT UNIQUE NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  background  TEXT,
  bg_opacity  REAL DEFAULT 15,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Posts (unified: articles + notes + chatters via `kind`)
CREATE TABLE IF NOT EXISTS posts (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,
  kind          TEXT NOT NULL DEFAULT 'post',  -- 'post' | 'note' | 'chatter'
  title         TEXT NOT NULL,
  content_md    TEXT NOT NULL,
  content_html  TEXT,
  summary       TEXT,
  cover         TEXT,
  draft         BOOLEAN NOT NULL DEFAULT FALSE,
  featured      BOOLEAN NOT NULL DEFAULT FALSE,
  mood          TEXT,
  location      TEXT,
  author_id     INTEGER REFERENCES authors(id) ON DELETE SET NULL,
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  word_count    INTEGER DEFAULT 0,
  reading_mins  REAL DEFAULT 0,
  published_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_kind_published ON posts(kind, published_at DESC) WHERE draft = FALSE;
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(published_at DESC) WHERE draft = FALSE;

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id   SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

-- Post-Tag many-to-many
CREATE TABLE IF NOT EXISTS post_tags (
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag_id  INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_post_tags_post ON post_tags(post_id);
CREATE INDEX IF NOT EXISTS idx_post_tags_tag  ON post_tags(tag_id);

-- Note images (embedded in note content)
CREATE TABLE IF NOT EXISTS note_images (
  id       SERIAL PRIMARY KEY,
  post_id  INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  src      TEXT NOT NULL,
  alt      TEXT,
  position INTEGER DEFAULT 0
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id               SERIAL PRIMARY KEY,
  slug             TEXT UNIQUE NOT NULL,
  name             TEXT NOT NULL,
  description      TEXT,
  tech_stack       JSONB NOT NULL DEFAULT '[]',
  github_url       TEXT,
  demo_url         TEXT,
  highlights       JSONB NOT NULL DEFAULT '[]',
  background       TEXT,
  problem          TEXT,
  solution         TEXT,
  results          TEXT,
  related_posts    JSONB NOT NULL DEFAULT '[]',
  code_index_enabled BOOLEAN DEFAULT FALSE,
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Friends (友链)
CREATE TABLE IF NOT EXISTS friends (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  description  TEXT,
  avatar       TEXT,
  theme_color  TEXT DEFAULT 'rgba(99,102,241,0.5)',
  approved     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Gallery photos
CREATE TABLE IF NOT EXISTS gallery_photos (
  id         SERIAL PRIMARY KEY,
  src        TEXT NOT NULL,
  title      TEXT,
  date       DATE,
  location   TEXT,
  album      TEXT DEFAULT 'default',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gallery_date ON gallery_photos(date DESC);

-- About profile (singleton)
CREATE TABLE IF NOT EXISTS site_profile (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  avatar     TEXT,
  bio        TEXT,
  bio2       TEXT,
  email      TEXT,
  github     TEXT,
  tagline    TEXT,
  skills     JSONB NOT NULL DEFAULT '[]',
  tech_stack JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Barrages (弹幕)
CREATE TABLE IF NOT EXISTS barrages (
  id         SERIAL PRIMARY KEY,
  content    TEXT NOT NULL,
  nick       TEXT,
  color      TEXT DEFAULT '#ffffff',
  position   INTEGER DEFAULT 0,
  ip_hash    TEXT,
  approved   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. Analytics tables (migrated from SQLite)
-- ============================================================

CREATE TABLE IF NOT EXISTS path_stats (
  path       TEXT PRIMARY KEY,
  pv         INTEGER NOT NULL DEFAULT 0,
  uv         INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS path_visitors (
  path       TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (path, visitor_id)
);

CREATE TABLE IF NOT EXISTS page_view_events (
  id         BIGSERIAL PRIMARY KEY,
  path       TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  referrer   TEXT,
  user_agent TEXT,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pve_viewed_at ON page_view_events(viewed_at);
CREATE INDEX IF NOT EXISTS idx_pve_path_time ON page_view_events(path, viewed_at);

CREATE TABLE IF NOT EXISTS likes (
  slug       TEXT PRIMARY KEY,
  count      INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS like_voters (
  slug       TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  voted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (slug, visitor_id)
);

-- ============================================================
-- 3. Auth & admin tables
-- ============================================================

CREATE TABLE IF NOT EXISTS auth_kv (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash      TEXT PRIMARY KEY,
  fail_count   INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Content revisions
CREATE TABLE IF NOT EXISTS revisions (
  id          BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id   INTEGER NOT NULL,
  payload     JSONB NOT NULL,
  author_id   INTEGER REFERENCES authors(id),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_id, created_at DESC);

-- Media assets
CREATE TABLE IF NOT EXISTS media (
  id            SERIAL PRIMARY KEY,
  key           TEXT UNIQUE NOT NULL,
  original_name TEXT,
  mime_type     TEXT NOT NULL,
  size_bytes    INTEGER,
  width         INTEGER,
  height        INTEGER,
  uploaded_by   INTEGER REFERENCES authors(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. Full-text search (tsvector)
-- ============================================================

CREATE TABLE IF NOT EXISTS search_index (
  post_id      INTEGER PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  title_vec    TSVECTOR NOT NULL,
  content_vec  TSVECTOR NOT NULL,
  tags_vec     TSVECTOR NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_title   ON search_index USING GIN(title_vec);
CREATE INDEX IF NOT EXISTS idx_search_content ON search_index USING GIN(content_vec);
CREATE INDEX IF NOT EXISTS idx_search_tags    ON search_index USING GIN(tags_vec);

-- Auto-update search index on post upsert
CREATE OR REPLACE FUNCTION posts_search_upsert() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO search_index(post_id, title_vec, content_vec, tags_vec, updated_at)
  VALUES (
    NEW.id,
    to_tsvector('simple', COALESCE(NEW.title, '')),
    to_tsvector('simple', COALESCE(NEW.content_md, '')),
    to_tsvector('simple', COALESCE(
      (SELECT string_agg(t.name, ' ') FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = NEW.id),
      ''
    )),
    NOW()
  )
  ON CONFLICT (post_id) DO UPDATE SET
    title_vec   = EXCLUDED.title_vec,
    content_vec = EXCLUDED.content_vec,
    tags_vec    = EXCLUDED.tags_vec,
    updated_at  = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_posts_search ON posts;
CREATE TRIGGER trg_posts_search
AFTER INSERT OR UPDATE OF title, content_md ON posts
FOR EACH ROW EXECUTE FUNCTION posts_search_upsert();

-- ============================================================
-- 5. Site config (key-value, for theme/barrage/etc.)
-- ============================================================

CREATE TABLE IF NOT EXISTS site_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
