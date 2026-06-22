import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { friends } from '../../db/schema.js';
export const friendsRoutes = new Hono();
friendsRoutes.get('/', async (c) => {
    const list = await db.query.friends.findMany({
        where: eq(friends.approved, true),
    });
    const items = list.map((f) => ({
        id: f.id,
        name: f.name,
        url: f.url,
        description: f.description,
        avatar: f.avatar,
        themeColor: f.themeColor || 'rgba(99,102,241,0.5)',
        sortOrder: f.sortOrder || 0,
        createdAt: f.createdAt.toISOString(),
    }));
    return c.json({ ok: true, data: { items } });
});
//# sourceMappingURL=friends.js.map