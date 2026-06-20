"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Rocket, Github, Globe } from "lucide-react";
import { ListHero } from "../../../components/admin/ListHero";

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
  draft?: boolean;
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

  const withDemo = projects.filter((p) => p.demoUrl).length;
  const withRepo = projects.filter((p) => p.githubUrl).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <ListHero
        icon={Rocket}
        hue="teal"
        title="项目"
        description="作品集与实战项目的展示橱窗"
        stats={[
          { label: "个项目", value: projects.length },
          { label: "带演示", value: withDemo },
          { label: "开源", value: withRepo },
        ]}
        action={
          <button
            onClick={() => openEditor()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:shadow-teal-500/40 hover:brightness-110 active:scale-95"
          >
            <Plus className="w-4 h-4" />新项目
          </button>
        }
      />

      <div className="relative mb-4 max-w-sm">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索项目…"
          className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--card-border)] p-12 text-center">
          <Rocket className="mx-auto mb-3 h-8 w-8 text-[var(--muted)] opacity-50" />
          <p className="text-sm text-[var(--muted)]">没有匹配的项目。点「新项目」创建。</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p, i) => (
            <li key={p.slug} className="animate-slide-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: "backwards" }}>
              <button
                onClick={() => openEditor(p.slug)}
                className="group relative w-full overflow-hidden rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/10"
              >
                {p.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover} alt="" className="aspect-video w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                ) : (
                  <div aria-hidden className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-teal-500/10 via-transparent to-emerald-500/10">
                    <Rocket className="h-8 w-8 text-teal-500/40" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="line-clamp-1 text-sm font-medium transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-300">{p.name || "（未命名）"}</span>
                    {p.draft && <span className="shrink-0 rounded bg-fuchsia-500/10 px-1.5 py-0.5 text-[10px] text-fuchsia-500">草稿</span>}
                    <span className="ml-auto flex shrink-0 items-center gap-1 text-[var(--muted)]">
                      {p.githubUrl && <Github className="h-3.5 w-3.5" />}
                      {p.demoUrl && <Globe className="h-3.5 w-3.5" />}
                    </span>
                  </div>
                  {p.description && <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{p.description}</p>}
                  {p.techStack.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {p.techStack.slice(0, 4).map((t) => (
                        <span key={t} className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] text-teal-600 dark:text-teal-300">{t}</span>
                      ))}
                      {p.techStack.length > 4 && (
                        <span className="px-1 py-0.5 text-[10px] text-[var(--muted)]">+{p.techStack.length - 4}</span>
                      )}
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
