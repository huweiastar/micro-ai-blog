"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CategoryEditor, type Category } from "../../../../components/admin/CategoryEditor";

export default function CategoryEditPage() {
  return (
    <Suspense fallback={null}>
      <CategoryEditInner />
    </Suspense>
  );
}

function CategoryEditInner() {
  const router = useRouter();
  const params = useSearchParams();
  const name = params.get("id");
  const isNew = params.get("new") === "1";

  const [existing, setExisting] = useState<Category | undefined>(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!name && !isNew) {
      router.replace("/admin/categories");
      return;
    }
    if (isNew) {
      setLoaded(true);
      return;
    }
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setExisting(Array.isArray(data) ? data.find((c) => c.name === name) : undefined);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [name, isNew, router]);

  if (!loaded) {
    return (
      <div className="h-screen flex items-center justify-center text-[var(--muted)]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <CategoryEditor
        key={name ?? "new"}
        name={name}
        isNew={isNew}
        existing={existing}
        onBack={() => router.push("/admin/categories")}
        onSaved={(savedName) => router.replace(`/admin/categories/edit?id=${encodeURIComponent(savedName)}`)}
        onDeleted={() => router.push("/admin/categories")}
      />
    </div>
  );
}
