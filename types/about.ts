export type SkillGroup = {
  title: string;
  items: string[];
};

/** 首页 Hero 区域展示的技术栈标签。icon 为图标键名（见 lib/tech-icons.ts） */
export type TechTag = {
  name: string;
  icon: string;
};

export type AboutProfile = {
  name: string;
  avatar: string;
  bio: string;
  bio2: string;
  email: string;
  github: string;
  skills: SkillGroup[];
  /** 首页技术栈标签（管理员可在后台配置） */
  techStack: TechTag[];
};
