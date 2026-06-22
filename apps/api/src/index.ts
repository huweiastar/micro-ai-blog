import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { postsRoutes } from './routes/public/posts.js';
import { categoriesRoutes } from './routes/public/categories.js';
import { tagsRoutes } from './routes/public/tags.js';
import { notesRoutes } from './routes/public/notes.js';
import { archiveRoutes } from './routes/public/archive.js';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Health check
app.get('/health', (c) => c.json({ ok: true, status: 'healthy' }));

// Public routes
app.route('/api/posts', postsRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/tags', tagsRoutes);
app.route('/api/notes', notesRoutes);
app.route('/api/archive', archiveRoutes);

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err.message, err.stack);
  return c.json({ ok: false, error: err.message || 'Internal server error' }, 500);
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
