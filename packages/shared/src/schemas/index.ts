import { z } from 'zod';

// Pagination query params
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Post list query
export const postListQuerySchema = paginationSchema.extend({
  kind: z.enum(['post', 'note', 'chatter']).optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
});

// Note list query
export const noteListQuerySchema = paginationSchema.extend({
  before: z.string().datetime().optional(),
});

// Page view payload
export const pageViewSchema = z.object({
  path: z.string().max(256).regex(/^\/[\w\-/%.一-鿿]*$/),
  visitorId: z.string().max(64),
  referrer: z.string().optional(),
  userAgent: z.string().optional(),
});

// Like toggle payload
export const likeToggleSchema = z.object({
  slug: z.string().max(256),
  visitorId: z.string().max(64),
});

// Barrage create payload
export const barrageCreateSchema = z.object({
  content: z.string().min(1).max(200),
  nick: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// Login payload
export const loginSchema = z.object({
  password: z.string().min(1),
});

// Slug param
export const slugParamSchema = z.object({
  slug: z.string().max(256),
});

// ID param
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type PaginationQuery = z.infer<typeof paginationSchema>;
export type PostListQuery = z.infer<typeof postListQuerySchema>;
export type NoteListQuery = z.infer<typeof noteListQuerySchema>;
export type PageViewPayload = z.infer<typeof pageViewSchema>;
export type LikeTogglePayload = z.infer<typeof likeToggleSchema>;
export type BarrageCreatePayload = z.infer<typeof barrageCreateSchema>;
export type LoginPayload = z.infer<typeof loginSchema>;
