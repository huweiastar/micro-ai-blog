import { Hono } from 'hono';
import { eq, and, desc, lt, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { posts, noteImages, postTags, tags } from '../../db/schema.js';
import { noteListQuerySchema } from '@pkg/shared/schemas';

export const notesRoutes = new Hono();

// GET /api/notes - list notes (kind='note')
notesRoutes.get('/', async (c) => {
  const query = noteListQuerySchema.parse({
    page: c.req.query('page'),
    limit: c.req.query('limit'),
    before: c.req.query('before'),
  });

  const { page, limit, before } = query;
  const offset = (page - 1) * limit;

  const conditions = [];
  conditions.push(eq(posts.draft, false));
  conditions.push(eq(posts.kind, 'note'));

  if (before) {
    conditions.push(lt(posts.publishedAt, new Date(before)));
  }

  // Get notes with images and tags
  const notesList = await db.query.posts.findMany({
    where: and(...conditions),
    with: {
      images: true,
      tags: {
        with: {
          tag: true,
        },
      },
    },
    orderBy: [desc(posts.publishedAt)],
    limit: limit + 1, // Fetch one extra to check hasMore
    offset,
  });

  const hasMore = notesList.length > limit;
  const items = notesList.slice(0, limit).map((note) => ({
    id: note.id,
    slug: note.slug,
    title: note.title,
    contentMd: note.contentMd,
    contentHtml: note.contentHtml,
    mood: note.mood,
    location: note.location,
    images: note.images.map((img) => ({
      src: img.src,
      alt: img.alt,
    })),
    tags: note.tags.map((pt) => pt.tag.name),
    publishedAt: note.publishedAt?.toISOString() || '',
  }));

  return c.json({ ok: true, data: { items, hasMore } });
});
