import { generatePageMetadata, generateWebsiteStructuredData, getSiteUrl } from "../lib/seo";
import { getAboutProfile } from "../lib/about";
import { HomeClient } from "./page.client";
import { BlogCard } from "../components/BlogCard";
import { ProjectCard } from "../components/ProjectCard";
import { RevealList } from "../components/RevealList";
import { HomeActivity, type ActivityItem } from "../components/HomeActivity";
import { LeftAside, RightAside } from "../components/home/HomeAside";
import { Container } from "../components/ui/Container";
import { api } from "../lib/api/client";
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

export default async function HomePage() {
  // 从 API 获取数据，失败时回退到空数据
  let posts: any[] = [];
  let projects: any[] = [];
  let categories: any[] = [];
  let tags: any[] = [];
  let recentNotes: any[] = [];
  let stats = { postCount: 0, totalWords: 0, projectCount: 0, columnCount: 0 };

  try {
    const [postsResult, projectsResult, categoriesResult, tagsResult] = await Promise.all([
      api.posts.list({ page: 1, limit: 5, kind: "post" }),
      api.projects.list(),
      api.categories.list(),
      api.tags.list(),
    ]);

    posts = postsResult.items.map((p) => ({
      slug: p.slug,
      title: p.title,
      date: p.publishedAt,
      summary: p.summary || "",
      tags: p.tags,
      category: p.category?.name || null,
      cover: p.cover,
      readingTime: p.readingMins,
      type: "post" as const,
      wordCount: p.wordCount,
    }));

    projects = projectsResult.items.slice(0, 3).map((p) => ({
      slug: p.slug,
      name: p.name,
      description: p.description,
      techStack: p.techStack,
      githubUrl: p.githubUrl,
      demoUrl: p.demoUrl,
    }));

    categories = categoriesResult.items.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      background: c.background,
      bgOpacity: c.bgOpacity,
      postCount: c.postCount,
    }));

    tags = tagsResult.items.slice(0, 12);

    stats = {
      postCount: postsResult.total,
      totalWords: posts.reduce((sum, p) => sum + (p.wordCount || 0), 0),
      projectCount: projectsResult.items.length,
      columnCount: categoriesResult.items.length,
    };

    // 获取最新随手记
    try {
      const notesResult = await api.notes.list({ page: 1, limit: 5 });
      recentNotes = notesResult.items.map((n) => ({
        slug: n.slug,
        title: n.title,
        date: n.publishedAt,
      }));
    } catch {
      // 忽略
    }
  } catch (err) {
    console.error("Failed to fetch data from API:", err);
  }

  // 最新动态
  const recentActivity: ActivityItem[] = posts.slice(0, 6).map((p) => ({
    date: p.date,
    type: "article" as const,
    title: p.title,
    href: `/blog/${p.slug}`,
  }));

  return (
    <div className="relative">
      <StructuredData data={generateWebsiteStructuredData()} />
      <HomeClient
        stats={stats}
        columns={categories.map((c) => ({
          name: c.name,
          desc: c.description || "",
          background: c.background,
          bgOpacity: c.bgOpacity,
        }))}
        initialVisits={{ pv: 0, uv: 0 }}
        barrage={[]}
      />

      {/* 主体三栏：左侧关于/专栏 · 中间内容流 · 右侧标签/随手记 */}
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
              categories={categories}
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
            <RightAside tags={tags} notes={recentNotes} />
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
