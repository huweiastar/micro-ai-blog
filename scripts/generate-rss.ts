import fs from "fs";
import path from "path";
import RSS from "rss";
import { getAllPostsSync } from "../lib/posts";
import { getSiteUrl } from "../lib/seo";
import { getAboutProfile } from "../lib/about";

function generateRSS() {
  const posts = getAllPostsSync();
  const siteUrl = getSiteUrl();
  const profile = getAboutProfile();

  const feed = new RSS({
    title: profile.name,
    description: "个人技术博客",
    site_url: siteUrl,
    feed_url: `${siteUrl}/rss.xml`,
    language: "zh-CN",
    pubDate: new Date(),
  });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.summary,
      url: `${siteUrl}/blog/${post.slug}`,
      date: new Date(post.date),
      categories: [post.category, ...post.tags],
    });
  });

  return feed.xml({ indent: true });
}

const rss = generateRSS();
const outputPath = path.join(process.cwd(), "public/rss.xml");

fs.writeFileSync(outputPath, rss, "utf-8");
console.log(`RSS feed generated: ${outputPath}`);
