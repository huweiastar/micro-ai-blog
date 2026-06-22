import { Hono } from 'hono';
import { db } from '../../db/index.js';
export const projectsRoutes = new Hono();
projectsRoutes.get('/', async (c) => {
    const list = await db.query.projects.findMany({
        orderBy: (t, { asc }) => [asc(t.sortOrder)],
    });
    const items = list.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        techStack: p.techStack || [],
        githubUrl: p.githubUrl,
        demoUrl: p.demoUrl,
        highlights: p.highlights || [],
        background: p.background,
        problem: p.problem,
        solution: p.solution,
        results: p.results,
        relatedPosts: p.relatedPosts || [],
        codeIndexEnabled: p.codeIndexEnabled ?? false,
        sortOrder: p.sortOrder || 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    }));
    return c.json({ ok: true, data: { items } });
});
projectsRoutes.get('/:slug', async (c) => {
    const slug = c.req.param('slug');
    const p = await db.query.projects.findFirst({
        where: (t, { eq }) => eq(t.slug, slug),
    });
    if (!p)
        return c.json({ ok: false, error: 'Not found' }, 404);
    const project = {
        id: p.id,
        slug: p.slug,
        name: p.name,
        description: p.description,
        techStack: p.techStack || [],
        githubUrl: p.githubUrl,
        demoUrl: p.demoUrl,
        highlights: p.highlights || [],
        background: p.background,
        problem: p.problem,
        solution: p.solution,
        results: p.results,
        relatedPosts: p.relatedPosts || [],
        codeIndexEnabled: p.codeIndexEnabled ?? false,
        sortOrder: p.sortOrder || 0,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
    };
    return c.json({ ok: true, data: { project } });
});
//# sourceMappingURL=projects.js.map