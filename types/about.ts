export type SkillGroup = {
  title: string;
  items: string[];
};

export type AboutProfile = {
  name: string;
  avatar: string;
  bio: string;
  bio2: string;
  email: string;
  github: string;
  skills: SkillGroup[];
};
