"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectEditor } from "../../../../components/admin/ProjectEditor";

export default function ProjectEditPage() {
  return (
    <Suspense fallback={null}>
      <ProjectEditInner />
    </Suspense>
  );
}

function ProjectEditInner() {
  const router = useRouter();
  const params = useSearchParams();
  const slug = params.get("id");
  const isNew = params.get("new") === "1";

  useEffect(() => {
    if (!slug && !isNew) router.replace("/admin/projects");
  }, [slug, isNew, router]);

  return (
    <div className="h-screen flex flex-col">
      <ProjectEditor
        key={slug ?? "new"}
        slug={slug}
        isNew={isNew}
        onBack={() => router.push("/admin/projects")}
        onSaved={(s) => {
          if (s) router.replace(`/admin/projects/edit?id=${s}`);
        }}
        onDeleted={() => router.push("/admin/projects")}
      />
    </div>
  );
}
