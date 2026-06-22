import { Hono } from 'hono';
import { desc } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { galleryPhotos } from '../../db/schema.js';

export const galleryRoutes = new Hono();

galleryRoutes.get('/', async (c) => {
  const album = c.req.query('album');

  const list = await db.query.galleryPhotos.findMany({
    orderBy: [desc(galleryPhotos.date)],
  });

  const photos = list
    .filter((p) => !album || p.album === album)
    .map((p) => ({
      id: p.id,
      src: p.src,
      title: p.title,
      date: p.date,
      location: p.location,
      album: p.album || 'default',
      sortOrder: p.sortOrder || 0,
      createdAt: p.createdAt.toISOString(),
    }));

  // Group by album
  const albumMap = new Map<string, typeof photos>();
  for (const p of photos) {
    const key = p.album;
    if (!albumMap.has(key)) albumMap.set(key, []);
    albumMap.get(key)!.push(p);
  }
  const albums = Array.from(albumMap.entries()).map(([name, items]) => ({
    album: name,
    photos: items,
  }));

  return c.json({ ok: true, data: { items: photos, albums } });
});
