import { getAllArticlesSync, getAllPostsSync, getAllTags } from "../lib/posts";
import { getProjects } from "../lib/projects";
import { getAllCategories } from "../lib/categories";
import { getAnalytics } from "../lib/analytics";
import { generatePageMetadata, generateWebsiteStructuredData, getSiteUrl } from "../lib/seo";
import { getAboutProfile } from "../lib/about";
import { HomeClient } from "./page.client";
import { readBarrage } from "../lib/barrage";
import { BlogCard } from "../components/BlogCard";
import { ProjectCard } from "../components/ProjectCard";
import { RevealList } from "../components/RevealList";
import { HomeActivity, type ActivityItem } from "../components/HomeActivity";
import { LeftAside, RightAside } from "../components/home/HomeAside";
import { Container } from "../components/ui/Container";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  const projects = allProjects.slice(0, 3);
  // 最新动态：文章 + 随手记按时间合并（getAllPostsSync 已按日期倒序）
  const recentActivity: ActivityItem[] = getAllPostsSync()
    .slice(0, 6)
    .map((p) => ({
      date: p.date,
      type: p.type === "note" ? "note" : "article",
      title: p.title,
      href: `/blog/${p.slug}`,
    }));
  // 侧栏数据：热门标签 + 最新随手记
  const topTags = getAllTags().slice(0, 12);
  const recentNotes = getAllPostsSync()
    .filter((p) => p.type === "note")
    .slice(0, 5)
    .map((p) => ({ slug: p.slug, title: p.title, date: p.date }));
  const totalWords = allPosts.reduce((sum, post) => sum + post.wordCount, 0);
  const stats = {
    postCount: allPosts.length,
    totalWords,
    projectCount: allProjects.length,
    columnCount: allCategories.length,
  };

  // 服务端直出，避免首屏闪 0/空 + 利于 SEO
  const columns = allCategories.map((c) => ({
    name: c.name,
    desc: c.description || "",
    background: c.background,
    bgOpacity: c.bgOpacity,
  }));
  // db 不可用（只读文件系统/权限问题）时兜底为 0，客户端 useEffect 会再拉取，
  // 不能让统计读取失败拖垮整个首页渲染或构建。
  let initialVisits = { pv: 0, uv: 0 };
  try {
    initialVisits = getAnalytics();
  } catch {
    // 保持默认值
  }
  const barrage = readBarrage();

  return (
    <div className="relative">
      <StructuredData data={generateWebsiteStructuredData()} />
      <HomeClient stats={stats} columns={columns} initialVisits={initialVisits} barrage={barrage} />

      {/* 主体三栏：左侧关于/专栏 · 中间内容流 · 右侧标签/随手记，填充宽屏两侧留白 */}
      <Container size="wide" className="mb-20 mt-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* 左栏 */}
          <aside className="hidden lg:col-span-3 lg:block">
            <LeftAside
              profile={{
                name: profile.name,
                avatar: profile.avatar,
                tagline: profile.tagline,
                github: profile.github,
                email: profile.email,
              }}
              categories={allCategories}
            />
          </aside>

          {/* 中栏内容流：最新动态 · 最新文章 · 精选项目 */}
          <div className="space-y-10 lg:col-span-6">
            {recentActivity.length > 0 && (
              <section>
                <HomeSectionHeader title="最新动态" moreHref="/footprint" />
                <HomeActivity items={recentActivity} />
              </section>
            )}

            <section>
              <HomeSectionHeader title="最新文章" moreHref="/blog" />
              <RevealList className="grid gap-6">
                {posts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </RevealList>
            </section>

            <section>
              <HomeSectionHeader title="精选项目" moreHref="/projects" />
              <div className="grid gap-6 sm:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.name} project={project} />
                ))}
              </div>
            </section>
          </div>

          {/* 右栏 */}
          <aside className="hidden lg:col-span-3 lg:block">
            <RightAside tags={topTags} notes={recentNotes} />
          </aside>
        </div>
      </Container>
    </div>
  );
}

function HomeSectionHeader({
  title,
  moreHref,
}: {
  title: string;
  moreHref: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Link
        href={moreHref}
        className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
      >
        查看全部 <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
