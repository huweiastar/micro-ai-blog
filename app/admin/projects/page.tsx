"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";

type Project = {
  slug: string;
  name: string;
  description: string;
  cover?: string;
  techStack: string[];
  highlights: string[];
  githubUrl?: string;
  demoUrl?: string;
  content?: string;
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((d) => setProjects(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return projects;
    const lq = q.trim().toLowerCase();
    return projects.filter(
      (p) => p.name.toLowerCase().includes(lq) || (p.description || "").toLowerCase().includes(lq)
    );
  }, [projects, q]);

  const openEditor = (slug?: string) =>
    router.push(slug ? `/admin/projects/edit?id=${slug}` : "/admin/projects/edit?new=1");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <header className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">项目</h1>
          <p className="text-sm text-[var(--muted)] mt-1">共 {projects.length} 个</p>
        </div>
        <button
          onClick={() => openEditor()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" />新项目
        </button>
      </header>

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索项目…"
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-10 text-center text-sm text-[var(--muted)]">
          没有匹配的项目。点「新项目」创建。
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <li key={p.slug}>
              <button
                onClick={() => openEditor(p.slug)}
                className="w-full text-left rounded-xl border border-[var(--card-border)] bg-[var(--card)] overflow-hidden transition-all hover:border-[var(--primary)]/50 hover:-translate-y-0.5"
              >
                {p.cover && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" className="w-full aspect-video object-cover" />
                )}
                <div className="p-3">
                  <div className="font-medium text-sm line-clamp-1">{p.name || "（未命名）"}</div>
                  {p.description && <p className="text-xs text-[var(--muted)] line-clamp-2 mt-1">{p.description}</p>}
                  {p.techStack.length > 0 && (
                    <div className="text-[11px] text-[var(--muted)] line-clamp-1 mt-1.5">
                      {p.techStack.slice(0, 5).join(" · ")}
                    </div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
