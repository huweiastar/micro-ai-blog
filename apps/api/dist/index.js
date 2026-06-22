import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { postsRoutes } from './routes/public/posts.js';
import { categoriesRoutes } from './routes/public/categories.js';
import { tagsRoutes } from './routes/public/tags.js';
import { notesRoutes } from './routes/public/notes.js';
import { archiveRoutes } from './routes/public/archive.js';
import { projectsRoutes } from './routes/public/projects.js';
import { friendsRoutes } from './routes/public/friends.js';
import { galleryRoutes } from './routes/public/gallery.js';
import { aboutRoutes } from './routes/public/about.js';
import { searchRoutes } from './routes/public/search.js';
import { analyticsRoutes } from './routes/public/analytics.js';
import { likesRoutes } from './routes/public/likes.js';
import { barrageRoutes } from './routes/public/barrage.js';
const app = new Hono();
// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: [
        'https://huweiastar.deepai.icu',
        'https://admin.huweiastar.deepai.icu',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
    ],
    credentials: true,
}));
// Health check
app.get('/health', (c) => c.json({ ok: true, status: 'healthy' }));
// Public routes
app.route('/api/posts', postsRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/tags', tagsRoutes);
app.route('/api/notes', notesRoutes);
app.route('/api/archive', archiveRoutes);
app.route('/api/projects', projectsRoutes);
app.route('/api/friends', friendsRoutes);
app.route('/api/gallery', galleryRoutes);
app.route('/api/about', aboutRoutes);
app.route('/api/search', searchRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/likes', likesRoutes);
app.route('/api/barrage', barrageRoutes);
// Error handler — 仅写日志，不回传内部错误信息
app.onError((err, c) => {
    console.error('Unhandled error:', err.message, err.stack);
    return c.json({ ok: false, error: 'Internal server error' }, 500);
});
// 404 handler
app.notFound((c) => {
    return c.json({ ok: false, error: 'Not found' }, 404);
});
const port = parseInt(process.env.API_PORT || '3001', 10);
console.log(`🚀 API server starting on port ${port}`);
serve({
    fetch: app.fetch,
    port,
});
console.log(`✅ API server running at http://localhost:${port}`);
//# sourceMappingURL=index.js.map