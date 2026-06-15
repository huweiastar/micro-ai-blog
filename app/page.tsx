import { getAllArticlesSync } from "../lib/posts";
import { getProjects } from "../lib/projects";
import { getAllCategories } from "../lib/categories";
import { getAnalytics } from "../lib/analytics";
import { generatePageMetadata, generateWebsiteStructuredData, getSiteUrl } from "../lib/seo";
import { getAboutProfile } from "../lib/about";
import { HomeClient } from "./page.client";
import { BlogCard } from "../components/BlogCard";
import { ProjectCard } from "../components/ProjectCard";
import { RevealList } from "../components/RevealList";
import { Section } from "../components/ui/Section";
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

  return (
    <div className="relative">
      <StructuredData data={generateWebsiteStructuredData()} />
      <HomeClient stats={stats} columns={columns} initialVisits={initialVisits} />

      {/* Latest Posts */}
      <Section title="最新文章" moreHref="/blog" className="mb-20">
        <RevealList className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </RevealList>
      </Section>

      {/* Featured Projects */}
      <Section title="精选项目" moreHref="/projects" className="mb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </Section>
    </div>
  );
}
