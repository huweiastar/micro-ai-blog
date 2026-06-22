import { Hono } from 'hono';
import { db } from '../../db/index.js';
export const aboutRoutes = new Hono();
aboutRoutes.get('/', async (c) => {
    const p = await db.query.siteProfile.findFirst();
    if (!p) {
        return c.json({
            ok: true,
            data: {
                profile: {
                    id: 0,
                    name: '',
                    avatar: null,
                    bio: null,
                    bio2: null,
                    email: null,
                    github: null,
                    tagline: null,
                    skills: [],
                    techStack: [],
                    updatedAt: new Date().toISOString(),
                },
            },
        });
    }
    const profile = {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        bio: p.bio,
        bio2: p.bio2,
        email: p.email,
        github: p.github,
        tagline: p.tagline,
        skills: p.skills || [],
        techStack: p.techStack || [],
        updatedAt: p.updatedAt.toISOString(),
    };
    return c.json({ ok: true, data: { profile } });
});
//# sourceMappingURL=about.js.map