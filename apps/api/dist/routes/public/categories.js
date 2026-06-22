import { Hono } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { categories, posts } from '../../db/schema.js';
export const categoriesRoutes = new Hono();
// GET /api/categories - list all categories with post counts
categoriesRoutes.get('/', async (c) => {
    const postCount = sql `count(${posts.id})`.mapWith(Number);
    const result = await db
        .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        background: categories.background,
        bgOpacity: categories.bgOpacity,
        sortOrder: categories.sortOrder,
        createdAt: categories.createdAt,
        postCount,
    })
        .from(categories)
        .leftJoin(posts, eq(posts.categoryId, categories.id))
        .groupBy(categories.id)
        .orderBy(desc(postCount));
    const items = result.map((cat) => ({
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        background: cat.background,
        bgOpacity: cat.bgOpacity || 15,
        sortOrder: cat.sortOrder || 0,
        createdAt: cat.createdAt.toISOString(),
        postCount: cat.postCount,
    }));
    return c.json({ ok: true, data: { items } });
});
// GET /api/categories/:slug/posts - get posts in category
categoriesRoutes.get('/:slug/posts', async (c) => {
    const slug = c.req.param('slug');
    const category = await db.query.categories.findFirst({
        where: sql `${categories.slug} = ${slug}`,
    });
    if (!category) {
        return c.json({ ok: false, error: 'Category not found' }, 404);
    }
    const postsList = await db.query.posts.findMany({
        where: sql `${posts.categoryId} = ${category.id} AND ${posts.draft} = false`,
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
//# sourceMappingURL=categories.js.map