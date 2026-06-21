export type NavItem = {
  title: string;
  href: string;
  external?: boolean;
};

export const navConfig: NavItem[] = [
  { title: "首页", href: "/" },
  { title: "博客", href: "/blog" },
  { title: "专栏", href: "/categories" },
  { title: "项目", href: "/projects" },
  { title: "说说", href: "/notes" },
  { title: "杂谈", href: "/chatters" },
  { title: "相册", href: "/gallery" },
  { title: "友链", href: "/friends" },
  { title: "标签", href: "/tags" },
  { title: "足迹", href: "/footprint" },
  { title: "留言板", href: "/guestbook" },
  { title: "关于我", href: "/about" },
];

// Footer「导航」列：跟随 navConfig 顺序，增删入口自动同步。
export const footerNav: NavItem[] = navConfig.slice(1, 5);

// Footer「探索」列：衍生功能入口（不在主导航内）。
export const footerExplore: NavItem[] = [
  { title: "知识图谱", href: "/graph" },
  { title: "数据统计", href: "/stats" },
  { title: "归档", href: "/archive" },
];
