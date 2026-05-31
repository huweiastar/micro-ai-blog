export type NavItem = {
  title: string;
  href: string;
  external?: boolean;
};

export const navConfig: NavItem[] = [
  { title: "首页", href: "/" },
  { title: "博客", href: "/blog" },
  { title: "分类", href: "/categories" },
  { title: "标签", href: "/tags" },
  { title: "项目", href: "/projects" },
  { title: "足迹", href: "/footprint" },
  { title: "关于我", href: "/about" },
];
