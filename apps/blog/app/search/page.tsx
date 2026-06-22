import fs from "fs";
import path from "path";
import { SearchBox } from "../../components/SearchBox";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import type { SearchItem } from "../../lib/posts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  ...generatePageMetadata({
    title: "搜索",
    description: "搜索博客文章",
    url: "/search",
  }),
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

function getSearchIndex(): SearchItem[] {
  const indexPath = path.join(process.cwd(), "public/search-index.json");
  if (!fs.existsSync(indexPath)) return [];

  const content = fs.readFileSync(indexPath, "utf-8");
  return JSON.parse(content);
}

export default function SearchPage() {
  const index = getSearchIndex();

  return (
    <Container size="prose" className="py-12">
      <h1 className="text-3xl font-bold mb-8">搜索文章</h1>
      <SearchBox index={index} />
    </Container>
  );
}
