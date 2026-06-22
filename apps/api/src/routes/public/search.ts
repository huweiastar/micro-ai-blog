import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { posts } from '../../db/schema.js';

export const searchRoutes = new Hono();

searchRoutes.get('/', async (c) => {
  const q = c.req.query('q') || '';
  const limit = Math.min(parseInt(c.req.query('limit') || '20', 10), 50);

  if (!q.trim()) {
    return c.json({ ok: true, data: { items: [], total: 0 } });
  }

  // Use ts_query for full-text search
  const tsQuery = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `${w}:*`)
    .join(' & ');

  const results = await db.execute(sql`
    SELECT
      p.slug,
      p.title,
      p.kind,
      p.summary,
      ts_rank(si.title_vec, to_tsquery('simple', ${tsQuery})) * 2 +
      ts_rank(si.content_vec, to_tsquery('simple', ${tsQuery})) as rank
    FROM search_index si
    JOIN posts p ON p.id = si.post_id
    WHERE si.title_vec @@ to_tsquery('simple', ${tsQuery})
       OR si.content_vec @@ to_tsquery('simple', ${tsQuery})
       OR p.title ILIKE ${`%${q}%`}
    ORDER BY rank DESC
    LIMIT ${limit}
  `);

  const items = (results.rows || []).map((r) => ({
    slug: (r as Record<string, unknown>).slug as string,
    title: (r as Record<string, unknown>).title as string,
    kind: (r as Record<string, unknown>).kind as string,
    summary: (r as Record<string, unknown>).summary as string,
    rank: parseFloat(String((r as Record<string, unknown>).rank)) || 0,
  }));

  return c.json({ ok: true, data: { items, total: items.length } });
});
