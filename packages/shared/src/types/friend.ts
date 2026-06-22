export interface Friend {
  id: number;
  name: string;
  url: string;
  description: string | null;
  avatar: string | null;
  themeColor: string;
  approved: boolean;
  sortOrder: number;
  createdAt: string;
}
