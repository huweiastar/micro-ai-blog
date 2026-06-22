export interface AboutProfile {
  id: number;
  name: string;
  avatar: string | null;
  bio: string | null;
  bio2: string | null;
  email: string | null;
  github: string | null;
  tagline: string | null;
  skills: Array<{ category: string; items: string[] }>;
  techStack: string[];
  updatedAt: string;
}
