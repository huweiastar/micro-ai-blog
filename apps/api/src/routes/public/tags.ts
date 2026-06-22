import { Hono } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { tags, postTags, posts } from '../../db/schema.js';

export const tagsRoutes = new Hono();

// GET /api/tags - list all tags with post counts
tagsRoutes.get('/', async (c) => {
  const postCount = sql<number>`count(${postTags.postId})`.mapWith(Number);
  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      postCount,
    })
    .from(tags)
    .leftJoin(postTags, eq(postTags.tagId, tags.id))
    .groupBy(tags.id)
    .orderBy(desc(postCount));

  const items = result.map((tag) => ({
    id: tag.id,
    name: tag.name,
    postCount: tag.postCount,
  }));

  return c.json({ ok: true, data: { items } });
});

// GET /api/tags/:name/posts - get posts with tag
tagsRoutes.get('/:name/posts', async (c) => {
  const name = c.req.param('name');

  const tag = await db.query.tags.findFirst({
    where: sql`${tags.name} = ${name}`,
  });

  if (!tag) {
    return c.json({ ok: false, error: 'Tag not found' }, 404);
  }

  const postsList = await db.query.posts.findMany({
    where: sql`
      ${posts.id} IN (
        SELECT ${postTags.postId} FROM ${postTags}
        WHERE ${postTags.tagId} = ${tag.id}
      )
      AND ${posts.draft} = false
    `,
    with: {
      category: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [desc(posts.publishedAt)],
  });

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

  return c.json({ ok: true, data: { items, total: items.length } });
});
