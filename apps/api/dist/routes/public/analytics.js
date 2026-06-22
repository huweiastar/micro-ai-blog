import { Hono } from 'hono';
import { eq, sql, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { pathStats, pathVisitors, pageViewEvents } from '../../db/schema.js';
import { pageViewSchema } from '@pkg/shared/schemas';
export const analyticsRoutes = new Hono();
// POST /api/analytics/pageview
analyticsRoutes.post('/pageview', async (c) => {
    try {
        const body = await c.req.json();
        const payload = pageViewSchema.parse(body);
        const now = new Date();
        // Record event
        await db.insert(pageViewEvents).values({
            path: payload.path,
            visitorId: payload.visitorId,
            referrer: payload.referrer || null,
            userAgent: payload.userAgent || null,
        });
        // Insert visitor if new (check if first time)
        const visitorInsert = await db
            .insert(pathVisitors)
            .values({ path: payload.path, visitorId: payload.visitorId })
            .onConflictDoNothing()
            .returning({ path: pathVisitors.path });
        const uvDelta = visitorInsert.length > 0 ? 1 : 0;
        // Update path stats (global)
        const globalPath = '__global__';
        await db
            .insert(pathStats)
            .values({ path: globalPath, pv: 1, uv: uvDelta, updatedAt: now })
            .onConflictDoUpdate({
            target: pathStats.path,
            set: { pv: sql `${pathStats.pv} + 1`, uv: sql `${pathStats.uv} + ${uvDelta}`, updatedAt: now },
        });
        // Update path stats (specific path)
        await db
            .insert(pathStats)
            .values({ path: payload.path, pv: 1, uv: uvDelta, updatedAt: now })
            .onConflictDoUpdate({
            target: pathStats.path,
            set: { pv: sql `${pathStats.pv} + 1`, uv: sql `${pathStats.uv} + ${uvDelta}`, updatedAt: now },
        });
        return c.json({ ok: true, data: { recorded: true } });
    }
    catch (err) {
        console.error('analytics POST error:', err);
        return c.json({ ok: false, error: 'Invalid payload' }, 400);
    }
});
// GET /api/analytics/stats
analyticsRoutes.get('/stats', async (c) => {
    const pathsParam = c.req.query('paths') || '';
    const paths = pathsParam.split(',').filter(Boolean);
    if (paths.length === 0) {
        return c.json({ ok: true, data: { stats: [] } });
    }
    const rows = await db.query.pathStats.findMany({
        where: inArray(pathStats.path, paths),
    });
    const stats = rows.map((r) => ({
        path: r.path,
        pv: r.pv,
        uv: r.uv,
        updatedAt: r.updatedAt.toISOString(),
    }));
    return c.json({ ok: true, data: { stats } });
});
// GET /api/analytics/overview
analyticsRoutes.get('/overview', async (c) => {
    const days = parseInt(c.req.query('days') || '30', 10);
    const globalRow = await db.query.pathStats.findFirst({
        where: eq(pathStats.path, '__global__'),
    });
    const topPaths = await db.query.pathStats.findMany({
        where: (t) => sql `${t.path} != '__global__'`,
        orderBy: (t, { desc }) => [desc(t.pv)],
        limit: 10,
    });
    const dailyTrend = await db.execute(sql `
    SELECT
      DATE(viewed_at) as date,
      COUNT(*) as pv,
      COUNT(DISTINCT visitor_id) as uv
    FROM page_view_events
    WHERE viewed_at > NOW() - INTERVAL '${sql.raw(String(days))} days'
    GROUP BY DATE(viewed_at)
    ORDER BY date
  `);
    return c.json({
        ok: true,
        data: {
            totalPv: globalRow?.pv || 0,
            totalUv: globalRow?.uv || 0,
            topPaths: topPaths.map((r) => ({
                path: r.path,
                pv: r.pv,
                uv: r.uv,
                updatedAt: r.updatedAt.toISOString(),
            })),
            dailyTrend: (dailyTrend.rows || []).map((r) => ({
                date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
                pv: Number(r.pv),
                uv: Number(r.uv),
            })),
        },
    });
});
//# sourceMappingURL=analytics.js.map