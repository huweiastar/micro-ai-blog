import Link from "next/link";
import { getAllCategories } from "../../lib/categories";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "专栏主题",
  description: "所有专栏主题",
});

export default function CategoriesPage() {
  const categories = getAllCategories();

  return (
    <>
      <PageHeader
        title="专栏主题"
        description="按主题组织的文章合集"
        count={categories.length}
        countLabel="个专栏"
      />
      <Container className="pb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={`/categories/${encodeURIComponent(category.name)}`}
            className="group glass rounded-xl p-6 border border-[var(--card-border)] hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
          >
            <h2 className="text-lg font-semibold group-hover:text-[var(--primary)] transition-colors mb-2">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-sm text-[var(--muted)] mb-2">{category.description}</p>
            )}
            <span className="text-sm text-[var(--primary)]">
              {category.count} 篇文章
            </span>
          </Link>
        ))}
        </div>
      </Container>
    </>
  );
}
