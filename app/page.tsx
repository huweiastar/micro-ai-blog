import { getAllPostsSync } from "../lib/posts";
import { getProjects } from "../lib/projects";
import { getAllCategories } from "../lib/categories";
import { generatePageMetadata, getSiteUrl } from "../lib/seo";
import { getAboutProfile } from "../lib/about";
import { HomeClient } from "./page.client";
import { BlogCard } from "../components/BlogCard";
import { ProjectCard } from "../components/ProjectCard";
import { Section } from "../components/ui/Section";
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
  const allPosts = getAllPostsSync();
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

  return (
    <div className="relative">
      <HomeClient stats={stats} />

      {/* Latest Posts */}
      <Section title="最新文章" moreHref="/blog" className="mb-20">
        <div className="grid gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
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
