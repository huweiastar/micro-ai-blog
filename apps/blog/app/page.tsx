import { getAllArticlesSync, getAllPostsSync, getAllTags } from "../lib/posts";
import { getProjects } from "../lib/projects";
import { getAllCategories } from "../lib/categories";
import { getAnalytics } from "../lib/analytics";
import { generatePageMetadata, generateWebsiteStructuredData, getSiteUrl } from "../lib/seo";
import { getAboutProfile } from "../lib/about";
import { HomeClient } from "./page.client";
import { BlogCard } from "../components/BlogCard";
import { ProjectCard } from "../components/ProjectCard";
import { HomeActivity, type ActivityItem } from "../components/HomeActivity";
import { SideAside } from "../components/home/SideAside";
import { ColumnGrid } from "../components/home/ColumnGrid";
import { RevealList } from "../components/RevealList";
import { Container } from "../components/ui/Container";
import { StructuredData } from "../components/StructuredData";
import type { Metadata } from "next";

const profile = getAboutProfile();

export const metadata: Metadata = generatePageMetadata({
  title: `${profile.name} | 个人技术博客`,
  description:
    "专注大数据开发、大模型数据工程、大模型基础架构与应用工程的个人技术博客",
  url: getSiteUrl(),
  type: "website",
});

export default function HomePage() {
  const allPosts = getAllArticlesSync();
  const allProjects = getProjects();
  const allCategories = getAllCategories();
  const posts = allPosts.slice(0, 5);
  const projects = allProjects.slice(0, 4);

  // 最新动态：文章 + 随手记按时间合并
  const recentActivity: ActivityItem[] = getAllPostsSync()
    .slice(0, 5)
    .map((p) => ({
      date: p.date,
      type: p.type === "note" ? "note" : "article",
      title: p.title,
      href: `/blog/${p.slug}`,
    }));

  // 侧栏数据
  const topTags = getAllTags().slice(0, 12);

  const totalWords = allPosts.reduce((sum, post) => sum + post.wordCount, 0);
  const stats = {
    postCount: allPosts.length,
    totalWords,
    projectCount: allProjects.length,
    columnCount: allCategories.length,
  };

  // 专栏数据
  const columns = allCategories.map((c) => ({
    name: c.name,
    desc: c.description || "",
    background: c.background,
    bgOpacity: c.bgOpacity,
  }));

  // 统计访问数据（兜底为 0）
  let initialVisits = { pv: 0, uv: 0 };
  try {
    initialVisits = getAnalytics();
  } catch {
    // 保持默认值
  }

  return (
    <div className="relative">
      <StructuredData data={generateWebsiteStructuredData()} />

      {/* Hero 区域 */}
      <HomeClient stats={stats} initialVisits={initialVisits} />

      {/* 主体：两栏布局（内容 + 侧栏） */}
      <Container className="mb-20 mt-12">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-12">
          {/* 主内容区 */}
          <div className="space-y-14 lg:col-span-9">
            {/* 最新动态 */}
            {recentActivity.length > 0 && (
              <section>
                <SectionHeader title="最新动态" moreHref="/footprint" />
                <HomeActivity items={recentActivity} />
              </section>
            )}

            {/* 专栏主题 */}
            {columns.length > 0 && (
              <section>
                <SectionHeader title="专栏主题" moreHref="/categories" />
                <ColumnGrid columns={columns.slice(0, 6)} />
              </section>
            )}

            {/* 最新文章 */}
            <section>
              <SectionHeader title="最新文章" moreHref="/blog" />
              <RevealList className="grid gap-6">
                {posts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </RevealList>
            </section>

            {/* 精选项目 */}
            {projects.length > 0 && (
              <section>
                <SectionHeader title="精选项目" moreHref="/projects" />
                <RevealList className="grid gap-6 sm:grid-cols-2">
                  {projects.map((project) => (
                    <ProjectCard key={project.name} project={project} />
                  ))}
                </RevealList>
              </section>
            )}
          </div>

          {/* 侧栏 */}
          <aside className="hidden lg:col-span-3 lg:block">
            <SideAside tags={topTags} />
          </aside>
        </div>
      </Container>
    </div>
  );
}

function SectionHeader({
  title,
  moreHref,
}: {
  title: string;
  moreHref: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="section-title-bar text-2xl font-bold tracking-tight text-[var(--foreground)]">
        {title}
      </h2>
      <a
        href={moreHref}
        className="text-sm text-[var(--muted)] transition-colors duration-200 hover:text-[var(--primary)]"
      >
        查看全部 →
      </a>
    </div>
  );
}
