import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  real,
  jsonb,
  timestamp,
  date,
  bigserial,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

// Authors
export const authors = pgTable('authors', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const authorsRelations = relations(authors, ({ many }) => ({
  posts: many(posts),
}));

// Categories
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  background: text('background'),
  bgOpacity: real('bg_opacity').default(15),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

// Posts (unified: articles + notes + chatters)
export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').unique().notNull(),
    kind: text('kind').notNull().default('post'), // 'post' | 'note' | 'chatter'
    title: text('title').notNull(),
    contentMd: text('content_md').notNull(),
    contentHtml: text('content_html'),
    summary: text('summary'),
    cover: text('cover'),
    draft: boolean('draft').notNull().default(false),
    featured: boolean('featured').notNull().default(false),
    mood: text('mood'),
    location: text('location'),
    authorId: integer('author_id').references(() => authors.id, { onDelete: 'set null' }),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    wordCount: integer('word_count').default(0),
    readingMins: real('reading_mins').default(0),
    publishedAt: timestamp('published_at'),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    kindPublishedIdx: index('idx_posts_kind_published').on(table.kind, table.publishedAt).where(sql`${table.draft} = false`),
    slugIdx: index('idx_posts_slug').on(table.slug),
    publishedIdx: index('idx_posts_published').on(table.publishedAt).where(sql`${table.draft} = false`),
  })
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(authors, { fields: [posts.authorId], references: [authors.id] }),
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  tags: many(postTags),
  images: many(noteImages),
}));

// Tags
export const tags = pgTable('tags', {
  id: serial('id').primaryKey(),
  name: text('name').unique().notNull(),
});

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));

// Post-Tag many-to-many
export const postTags = pgTable(
  'post_tags',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: uniqueIndex('post_tags_pkey').on(table.postId, table.tagId),
    postIdx: index('idx_post_tags_post').on(table.postId),
    tagIdx: index('idx_post_tags_tag').on(table.tagId),
  })
);

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

// Note images
export const noteImages = pgTable('note_images', {
  id: serial('id').primaryKey(),
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  src: text('src').notNull(),
  alt: text('alt'),
  position: integer('position').default(0),
});

export const noteImagesRelations = relations(noteImages, ({ one }) => ({
  post: one(posts, { fields: [noteImages.postId], references: [posts.id] }),
}));

// Projects
export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  techStack: jsonb('tech_stack').notNull().default([]),
  githubUrl: text('github_url'),
  demoUrl: text('demo_url'),
  highlights: jsonb('highlights').notNull().default([]),
  background: text('background'),
  problem: text('problem'),
  solution: text('solution'),
  results: text('results'),
  relatedPosts: jsonb('related_posts').notNull().default([]),
  codeIndexEnabled: boolean('code_index_enabled').default(false),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Friends
export const friends = pgTable('friends', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  avatar: text('avatar'),
  themeColor: text('theme_color').default('rgba(99,102,241,0.5)'),
  approved: boolean('approved').notNull().default(true),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Gallery photos
export const galleryPhotos = pgTable(
  'gallery_photos',
  {
    id: serial('id').primaryKey(),
    src: text('src').notNull(),
    title: text('title'),
    date: date('date'),
    location: text('location'),
    album: text('album').default('default'),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    dateIdx: index('idx_gallery_date').on(table.date),
  })
);

// Site profile (singleton)
export const siteProfile = pgTable('site_profile', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  bio: text('bio'),
  bio2: text('bio2'),
  email: text('email'),
  github: text('github'),
  tagline: text('tagline'),
  skills: jsonb('skills').notNull().default([]),
  techStack: jsonb('tech_stack').notNull().default([]),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Barrages
export const barrages = pgTable('barrages', {
  id: serial('id').primaryKey(),
  content: text('content').notNull(),
  nick: text('nick'),
  color: text('color').default('#ffffff'),
  position: integer('position').default(0),
  ipHash: text('ip_hash'),
  approved: boolean('approved').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Path stats
export const pathStats = pgTable('path_stats', {
  path: text('path').primaryKey(),
  pv: integer('pv').notNull().default(0),
  uv: integer('uv').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Path visitors
export const pathVisitors = pgTable('path_visitors', {
  path: text('path').notNull(),
  visitorId: text('visitor_id').notNull(),
  viewedAt: timestamp('viewed_at').notNull().defaultNow(),
});

// Page view events
export const pageViewEvents = pgTable(
  'page_view_events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    path: text('path').notNull(),
    visitorId: text('visitor_id').notNull(),
    referrer: text('referrer'),
    userAgent: text('user_agent'),
    viewedAt: timestamp('viewed_at').notNull().defaultNow(),
  },
  (table) => ({
    viewedAtIdx: index('idx_pve_viewed_at').on(table.viewedAt),
    pathTimeIdx: index('idx_pve_path_time').on(table.path, table.viewedAt),
  })
);

// Likes
export const likes = pgTable('likes', {
  slug: text('slug').primaryKey(),
  count: integer('count').notNull().default(0),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Like voters
export const likeVoters = pgTable('like_voters', {
  slug: text('slug').notNull(),
  visitorId: text('visitor_id').notNull(),
  votedAt: timestamp('voted_at').notNull().defaultNow(),
});

// Auth KV
export const authKv = pgTable('auth_kv', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Login attempts
export const loginAttempts = pgTable('login_attempts', {
  ipHash: text('ip_hash').primaryKey(),
  failCount: integer('fail_count').notNull().default(0),
  lockedUntil: timestamp('locked_until').notNull().defaultNow(),
  windowStart: timestamp('window_start').notNull().defaultNow(),
});

// Revisions
export const revisions = pgTable(
  'revisions',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    entityType: text('entity_type').notNull(),
    entityId: integer('entity_id').notNull(),
    payload: jsonb('payload').notNull(),
    authorId: integer('author_id').references(() => authors.id),
    note: text('note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    entityIdx: index('idx_revisions_entity').on(table.entityType, table.entityId, table.createdAt),
  })
);

// Media
export const media = pgTable('media', {
  id: serial('id').primaryKey(),
  key: text('key').unique().notNull(),
  originalName: text('original_name'),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes'),
  width: integer('width'),
  height: integer('height'),
  uploadedBy: integer('uploaded_by').references(() => authors.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Site config
export const siteConfig = pgTable('site_config', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
