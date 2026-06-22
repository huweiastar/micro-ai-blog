export interface ArchivePost {
  slug: string;
  title: string;
  publishedAt: string;
  category: { slug: string; name: string } | null;
}

export interface ArchiveMonth {
  month: number;
  posts: ArchivePost[];
}

export interface ArchiveYear {
  year: number;
  count: number;
  months: ArchiveMonth[];
}

export type ArchiveTree = ArchiveYear[];
