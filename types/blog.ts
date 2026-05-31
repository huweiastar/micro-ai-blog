export type TocItem = {
  id: string;
  text: string;
  level: number;
};

export type PostType =
  | "article"
  | "note"
  | "interview"
  | "project"
  | "tutorial";

export type PostLayout =
  | "PostLayout"
  | "SimplePostLayout"
  | "ProjectLayout"
  | "NoteLayout";

export type BlogPost = {
  slug: string;
  title: string;
  date: string;
  updated?: string;
  summary: string;
  content: string;
  tags: string[];
  category: string;
  draft: boolean;
  cover?: string;
  author?: string;
  type?: PostType;
  layout?: PostLayout;
  readingTime: string;
  wordCount: number;
  toc: TocItem[];
};

export type SearchItem = {
  title: string;
  summary: string;
  tags: string[];
  category: string;
  content: string;
  slug: string;
  date: string;
};

export type Tag = {
  name: string;
  count: number;
};

export type Category = {
  name: string;
  count: number;
};

export type SeoMeta = {
  title: string;
  description: string;
  keywords?: string[];
  url?: string;
  image?: string;
  type?: "website" | "article";
};

export type ArchiveGroup = {
  year: string;
  months: {
    month: string;
    posts: BlogPost[];
  }[];
};
