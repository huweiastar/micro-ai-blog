export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  background: string | null;
  bgOpacity: number;
  sortOrder: number;
}

export interface CategoryWithCount extends Category {
  postCount: number;
}
