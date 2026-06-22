import { Hono } from 'hono';
import { eq, and, desc, sql, ilike } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { posts, categories, tags, postTags } from '../../db/schema.js';
import { postListQuerySchema } from '@pkg/shared/schemas';

export const postsRoutes = new Hono();

// GET /api/posts - list published posts
postsRoutes.get('/', async (c) => {
  const query = postListQuerySchema.parse({
    page: c.req.query('page'),
    limit: c.req.query('limit'),
    kind: c.req.query('kind'),
    category: c.req.query('category'),
    tag: c.req.query('tag'),
    search: c.req.query('search'),
  });

  const { page, limit, kind, category, tag, search } = query;
  const offset = (page - 1) * limit;

  // Build conditions
  const conditions = [];
  conditions.push(eq(posts.draft, false));

  if (kind) {
    conditions.push(eq(posts.kind, kind));
  }

  if (search) {
    conditions.push(
      sql`(${posts.title} ILIKE ${`%${search}%`} OR ${posts.summary} ILIKE ${`%${search}%`})`
    );
  }

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(posts)
    .where(and(...conditions));

  const total = Number(countResult[0]?.count || 0);

  // Get posts with category and tags
  const postsList = await db.query.posts.findMany({
    where: and(...conditions),
    with: {
      category: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [desc(posts.publishedAt)],
    limit,
    offset,
  });

  // Transform to API response format
  const items = postsList.map((post) => ({
    id: post.id,
    slug: post.slug,
    kind: post.kind,
    title: post.title,
    summary: post.summary,
    cover: post.cover,
    draft: post.draft,
    featured: post.featured,
    mood: post.mood,
    location: post.location,
    wordCount: post.wordCount || 0,
    readingMins: post.readingMins || 0,
    publishedAt: post.publishedAt?.toISOString() || '',
    updatedAt: post.updatedAt.toISOString(),
    category: post.category
      ? { slug: post.category.slug, name: post.category.name }
      : null,
    tags: post.tags.map((pt) => pt.tag.name),
  }));

  return c.json({
    ok: true,
    data: {
      items,
      total,
      page,
      pages: Math.ceil(total / limit),
    },
  });
});

// GET /api/posts/:slug - get single post
postsRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  const post = await db.query.posts.findFirst({
    where: and(eq(posts.slug, slug), eq(posts.draft, false)),
    with: {
      author: true,
      category: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!post) {
    return c.json({ ok: false, error: 'Post not found' }, 404);
  }

  // Get related posts (by tags)
  const tagIds = post.tags.map((pt) => pt.tag.id);
  let relatedPosts: any[] = [];

  if (tagIds.length > 0) {
    relatedPosts = await db.query.posts.findMany({
      where: and(
        eq(posts.draft, false),
        sql`${posts.id} != ${post.id}`
      ),
      with: {
        category: true,
        tags: {
          with: {
            tag: true,
          },
        },
      },
      orderBy: [desc(posts.publishedAt)],
      limit: 5,
    });
  }

  const result = {
    id: post.id,
    slug: post.slug,
    kind: post.kind,
    title: post.title,
    contentMd: post.contentMd,
    contentHtml: post.contentHtml,
    summary: post.summary,
    cover: post.cover,
    draft: post.draft,
    featured: post.featured,
    mood: post.mood,
    location: post.location,
    wordCount: post.wordCount || 0,
    readingMins: post.readingMins || 0,
    publishedAt: post.publishedAt?.toISOString() || '',
    updatedAt: post.updatedAt.toISOString(),
    author: post.author
      ? { name: post.author.name, avatar: post.author.avatar }
      : null,
    category: post.category
      ? { slug: post.category.slug, name: post.category.name }
      : null,
    tags: post.tags.map((pt) => pt.tag.name),
    relatedPosts: relatedPosts.map((rp) => ({
      id: rp.id,
      slug: rp.slug,
      kind: rp.kind,
      title: rp.title,
      summary: rp.summary,
      cover: rp.cover,
      publishedAt: rp.publishedAt?.toISOString() || '',
      category: rp.category
        ? { slug: rp.category.slug, name: rp.category.name }
        : null,
      tags: rp.tags.map((pt: any) => pt.tag.name),
    })),
  };

  return c.json({ ok: true, data: { post: result } });
});

// GET /api/posts/:slug/related - get related posts
postsRoutes.get('/:slug/related', async (c) => {
  const slug = c.req.param('slug');
  const limit = parseInt(c.req.query('limit') || '5', 10);

  const post = await db.query.posts.findFirst({
    where: eq(posts.slug, slug),
    with: {
      tags: {
        with: {
          tag: true,
        },
      },
    },
  });

  if (!post) {
    return c.json({ ok: false, error: 'Post not found' }, 404);
  }

  // Get related posts (simplified: just recent posts for now)
  const relatedPosts = await db.query.posts.findMany({
    where: and(
      eq(posts.draft, false),
      sql`${posts.id} != ${post.id}`
    ),
    with: {
      category: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [desc(posts.publishedAt)],
    limit,
  });

  const items = relatedPosts.map((rp) => ({
    id: rp.id,
    slug: rp.slug,
    kind: rp.kind,
    title: rp.title,
    summary: rp.summary,
    cover: rp.cover,
    publishedAt: rp.publishedAt?.toISOString() || '',
    category: rp.category
      ? { slug: rp.category.slug, name: rp.category.name }
      : null,
    tags: rp.tags.map((pt) => pt.tag.name),
  }));

  return c.json({ ok: true, data: { items } });
});
