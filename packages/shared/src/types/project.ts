export interface Project {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  techStack: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  highlights: string[];
  background: string | null;
  problem: string | null;
  solution: string | null;
  results: string | null;
  relatedPosts: string[];
  codeIndexEnabled: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
