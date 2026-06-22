import { Hono } from 'hono';
import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { posts, categories } from '../../db/schema.js';

export const archiveRoutes = new Hono();

// GET /api/archive - get archive tree (posts grouped by year/month)
archiveRoutes.get('/', async (c) => {
  const postsList = await db.query.posts.findMany({
    where: eq(posts.draft, false),
    with: {
      category: true,
    },
    orderBy: [desc(posts.publishedAt)],
  });

  // Group by year and month
  const yearMap = new Map<number, Map<number, any[]>>();

  for (const post of postsList) {
    if (!post.publishedAt) continue;

    const date = new Date(post.publishedAt);
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-12

    if (!yearMap.has(year)) {
      yearMap.set(year, new Map());
    }
    const monthMap = yearMap.get(year)!;

    if (!monthMap.has(month)) {
      monthMap.set(month, []);
    }
    monthMap.get(month)!.push({
      slug: post.slug,
      title: post.title,
      publishedAt: post.publishedAt.toISOString(),
      category: post.category
        ? { slug: post.category.slug, name: post.category.name }
        : null,
    });
  }

  // Transform to archive tree structure
  const years = Array.from(yearMap.entries())
    .sort(([a], [b]) => b - a) // Sort years descending
    .map(([year, monthMap]) => {
      const months = Array.from(monthMap.entries())
        .sort(([a], [b]) => b - a) // Sort months descending
        .map(([month, posts]) => ({
          month,
          posts,
        }));

      const count = months.reduce((sum, m) => sum + m.posts.length, 0);

      return {
        year,
        count,
        months,
      };
    });

  return c.json({ ok: true, data: { years } });
});
