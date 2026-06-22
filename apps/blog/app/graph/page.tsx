import { getAllArticlesSync } from "../../lib/posts";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { KnowledgeGraph, type GraphArticle } from "../../components/KnowledgeGraph";
import { generatePageMetadata } from "../../lib/seo";
import { Network } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "知识图谱",
  description: "文章与标签交织的关系网络",
  url: "/graph",
});

export default function GraphPage() {
  const articles: GraphArticle[] = getAllArticlesSync().map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category,
    tags: a.tags,
  }));

  return (
    <>
      <PageHeader
        title="知识图谱"
        description="文章与标签交织的关系网络，点击节点直达文章"
        count={articles.length}
        countLabel="篇"
      />
      <Container size="wide" className="pb-16">
        {articles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-20 text-center">
            <Network className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]/60" />
            <p className="text-sm text-[var(--muted)]">还没有足够的文章来编织图谱。</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-2">
            <KnowledgeGraph articles={articles} />
          </div>
        )}
      </Container>
    </>
  );
}
