// Post types (articles + notes + chatters)
export type PostKind = 'post' | 'note' | 'chatter';

export interface PostListItem {
  id: number;
  slug: string;
  kind: PostKind;
  title: string;
  summary: string | null;
  cover: string | null;
  draft: boolean;
  featured: boolean;
  mood: string | null;
  location: string | null;
  wordCount: number;
  readingMins: number;
  publishedAt: string;
  updatedAt: string;
  category: { slug: string; name: string } | null;
  tags: string[];
}

export interface PostDetail extends PostListItem {
  contentMd: string;
  contentHtml: string | null;
  author: { name: string; avatar: string | null } | null;
  relatedPosts: PostListItem[];
}

export interface NoteItem {
  id: number;
  slug: string;
  title: string;
  contentMd: string;
  contentHtml: string | null;
  mood: string | null;
  location: string | null;
  images: { src: string; alt: string | null }[];
  tags: string[];
  publishedAt: string;
}

export interface ChatterItem {
  id: number;
  slug: string;
  title: string;
  contentMd: string;
  contentHtml: string | null;
  mood: string | null;
  cover: string | null;
  summary: string | null;
  tags: string[];
  publishedAt: string;
}
