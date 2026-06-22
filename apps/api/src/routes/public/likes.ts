import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { likes, likeVoters } from '../../db/schema.js';
import { likeToggleSchema } from '@pkg/shared/schemas';

export const likesRoutes = new Hono();

// GET /api/likes/:slug
likesRoutes.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const row = await db.query.likes.findFirst({
    where: eq(likes.slug, slug),
  });
  return c.json({ ok: true, data: { count: row?.count || 0 } });
});

// POST /api/likes/toggle
likesRoutes.post('/toggle', async (c) => {
  try {
    const body = await c.req.json();
    const { slug, visitorId } = likeToggleSchema.parse(body);
    const now = new Date().toISOString();

    // Check if already liked
    const existing = await db
      .select()
      .from(likeVoters)
      .where(sql`${likeVoters.slug} = ${slug} AND ${likeVoters.visitorId} = ${visitorId}`)
      .limit(1);

    if (existing.length > 0) {
      // Unlike
      await db
        .delete(likeVoters)
        .where(sql`${likeVoters.slug} = ${slug} AND ${likeVoters.visitorId} = ${visitorId}`);
      await db
        .update(likes)
        .set({ count: sql`GREATEST(${likes.count} - 1, 0)`, updatedAt: now })
        .where(eq(likes.slug, slug));
      const row = await db.query.likes.findFirst({ where: eq(likes.slug, slug) });
      return c.json({ ok: true, data: { count: row?.count || 0, liked: false } });
    } else {
      // Like
      await db.insert(likeVoters).values({ slug, visitorId });
      await db
        .insert(likes)
        .values({ slug, count: 1, updatedAt: now })
        .onConflictDoUpdate({
          target: likes.slug,
          set: { count: sql`${likes.count} + 1`, updatedAt: now },
        });
      const row = await db.query.likes.findFirst({ where: eq(likes.slug, slug) });
      return c.json({ ok: true, data: { count: row?.count || 1, liked: true } });
    }
  } catch (err: any) {
    return c.json({ ok: false, error: err.message || 'Invalid payload' }, 400);
  }
});
