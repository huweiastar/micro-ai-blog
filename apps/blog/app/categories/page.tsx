import Link from "next/link";
import { getCategoryStyle } from "../../lib/category-style";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { CategoryBar } from "../../components/ui/CategoryBar";
import { generatePageMetadata } from "../../lib/seo";
import { api } from "../../lib/api/client";
import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import type { CSSProperties } from "react";

export const metadata: Metadata = generatePageMetadata({
  title: "专栏主题",
  description: "所有专栏主题",
});

export default async function CategoriesPage() {
  let categories: Array<{
    name: string;
    slug: string;
    description: string | null;
    count: number;
  }> = [];

  try {
    const { items } = await api.categories.list();
    categories = items.map((c) => ({
      name: c.name,
      slug: c.slug,
      description: c.description,
      count: c.postCount,
    }));
  } catch (err) {
    console.error("Failed to fetch categories from API:", err);
  }

  return (
    <>
      <PageHeader
        title="专栏主题"
        description="按主题组织的文章合集"
        count={categories.length}
        countLabel="个专栏"
      />
      <Container className="pb-12">
        {/* 分类占比条 */}
        <div className="mb-10">
          <CategoryBar categories={categories.map((c) => ({ ...c, background: null, bgOpacity: 15 }))} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const style = getCategoryStyle(category.name);
            const Icon = style.icon;
            const grad = `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})`;

            return (
              <Link
                key={category.name}
                href={`/categories/${encodeURIComponent(category.name)}`}
                style={{ "--cat": style.accent } as CSSProperties}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--cat)] hover:shadow-[0_14px_32px_-14px_var(--cat)]"
              >
                <div className="absolute inset-x-0 top-0 h-1 opacity-90" style={{ background: grad }} />
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
                  style={{ background: style.accent }}
                />
                <div className="relative z-10 flex flex-1 flex-col">
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105"
                      style={{ background: grad }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold transition-colors group-hover:text-[var(--cat)]">
                      {category.name}
                    </h2>
                  </div>
                  {category.description && (
                    <p className="mb-4 text-sm leading-relaxed text-[var(--muted)]">
                      {category.description}
                    </p>
                  )}
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-[var(--muted)] transition-colors group-hover:text-[var(--cat)]">
                    {category.count} 篇文章
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
