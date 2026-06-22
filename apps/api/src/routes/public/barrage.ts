import { Hono } from 'hono';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { barrages } from '../../db/schema.js';
import { barrageCreateSchema } from '@pkg/shared/schemas';

export const barrageRoutes = new Hono();

// GET /api/barrage
barrageRoutes.get('/', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50', 10), 200);
  const list = await db.query.barrages.findMany({
    where: eq(barrages.approved, true),
    orderBy: [desc(barrages.createdAt)],
    limit,
  });

  const items = list.map((b) => ({
    id: b.id,
    content: b.content,
    nick: b.nick,
    color: b.color || '#ffffff',
    approved: b.approved,
    createdAt: b.createdAt.toISOString(),
  }));

  return c.json({ ok: true, data: { items } });
});

// POST /api/barrage
barrageRoutes.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const payload = barrageCreateSchema.parse(body);

    const ipHash = c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    const [inserted] = await db
      .insert(barrages)
      .values({
        content: payload.content,
        nick: payload.nick || null,
        color: payload.color || '#ffffff',
        ipHash,
      })
      .returning();

    return c.json({
      ok: true,
      data: {
        barrage: {
          id: inserted.id,
          content: inserted.content,
          nick: inserted.nick,
          color: inserted.color || '#ffffff',
          approved: inserted.approved,
          createdAt: inserted.createdAt.toISOString(),
        },
      },
    });
  } catch (err: unknown) {
    console.error('barrage POST error:', err);
    return c.json({ ok: false, error: 'Invalid payload' }, 400);
  }
});
