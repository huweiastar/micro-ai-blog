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
