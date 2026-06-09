"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArticleEditor, type CategoryConfig } from "../../../../components/admin/ArticleEditor";

export default function ArticleEditPage() {
  return (
    <Suspense fallback={null}>
      <ArticleEditInner />
    </Suspense>
  );
}

function ArticleEditInner() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("id");
  const isNew = params.get("new") === "1";

  const [categories, setCategories] = useState<CategoryConfig[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  // 无目标（既不是新建也没有 id）→ 回列表。
  useEffect(() => {
    if (!slug && !isNew) router.replace("/admin/articles");
  }, [slug, isNew, router]);

  return (
    <div className="h-screen flex flex-col">
      <ArticleEditor
        key={slug ?? "new"}
        slug={slug}
        isNew={isNew}
        categories={categories}
        onBack={() => router.push("/admin/articles")}
        onSaved={(savedSlug) => {
          if (savedSlug) router.replace(`/admin/articles/edit?id=${savedSlug}`);
        }}
        onDeleted={() => router.push("/admin/articles")}
      />
    </div>
  );
}
