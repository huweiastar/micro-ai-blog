"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SplitWorkspace } from "../../../components/admin/SplitWorkspace";
import { MarkdownEditor } from "../../../components/admin/MarkdownEditor";
import { Loader2, Trash2 } from "lucide-react";

type Category = {
  id: string;
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
  description_long?: string;
  cover?: string;
};

const BG_PRESETS = ["gradient-1", "gradient-2", "gradient-3", "gradient-4", "gradient-5", "gradient-6"];

export default function CategoriesPage() {
  return (
    <Suspense fallback={null}>
      <CategoriesPageInner />
    </Suspense>
  );
}

function CategoriesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("id");
  const isNew = params.get("new") === "1";

  const [items, setItems] = useState<Category[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((data: Category[]) => {
      setItems(data.map((c) => ({ ...c, id: c.name })));
    });
    fetch("/api/posts").then((r) => r.json()).then((posts: { category: string }[]) => {
      const map: Record<string, number> = {};
      posts.forEach((p) => { map[p.category] = (map[p.category] ?? 0) + 1; });
      setCounts(map);
    });
  }, []);

  return (
    <SplitWorkspace<Category>
      items={items}
      selectedId={selectedId}
      onSelect={(id) => router.push(id ? `/admin/categories?id=${encodeURIComponent(id)}` : "/admin/categories")}
      onNew={() => router.push("/admin/categories?new=1")}
      newButtonLabel="新专栏"
      searchPredicate={(c, q) => c.name.toLowerCase().includes(q)}
      renderRow={(c) => (
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-sm">{c.name}</span>
            <span className="text-xs text-[var(--muted)]">{counts[c.name] ?? 0} 篇</span>
          </div>
          {c.description && <div className="text-xs text-[var(--muted)] line-clamp-2">{c.description}</div>}
        </div>
      )}
    >
      {selectedId || isNew ? (
        <CategoryEditor
          key={selectedId ?? "new"}
          name={selectedId}
          isNew={isNew}
          existing={items.find((c) => c.id === selectedId)}
          onSaved={(savedName) => {
            fetch("/api/categories").then((r) => r.json()).then((data: Category[]) => setItems(data.map((c) => ({ ...c, id: c.name }))));
            router.replace(`/admin/categories?id=${encodeURIComponent(savedName)}`);
          }}
          onDeleted={(deletedName) => {
            setItems((prev) => prev.filter((c) => c.id !== deletedName));
            router.replace("/admin/categories");
          }}
        />
      ) : null}
    </SplitWorkspace>
  );
}

function CategoryEditor({
  name, isNew, existing, onSaved, onDeleted,
}: {
  name: string | null; isNew: boolean; existing?: Category;
  onSaved: (name: string) => void; onDeleted: (name: string) => void;
}) {
  const [formName, setFormName] = useState(existing?.name ?? "");
  const [formDesc, setFormDesc] = useState(existing?.description ?? "");
  const [formBg, setFormBg] = useState(existing?.background ?? "");
  const [formOpacity, setFormOpacity] = useState(existing?.bgOpacity ?? 15);
  const [formCover, setFormCover] = useState(existing?.cover ?? "");
  const [formLongDesc, setFormLongDesc] = useState(existing?.description_long ?? "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const isEdit = !isNew && !!name;
  const draftKey = `draft:categories:${name ?? "new"}`;
  const save = async () => {
    if (!formName.trim()) {
      setMsg({ ok: false, text: "名称不能为空" });
      return;
    }
    setSaving(true);
    const payload = {
      name: formName.trim(),
      description: formDesc,
      background: formBg || undefined,
      bgOpacity: formOpacity,
      description_long: formLongDesc || undefined,
      cover: formCover || undefined,
    };
    const isEdit = !isNew && !!name;
    const res = await fetch("/api/categories", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEdit ? { ...payload, oldName: name } : payload),
    });
    const data = await res.json();
    setSaving(false);
    if (data.success) {
      if (typeof window !== "undefined") window.localStorage.removeItem(draftKey);
      setMsg({ ok: true, text: "已保存" });
      onSaved(payload.name);
    } else {
      setMsg({ ok: false, text: data.error || "保存失败" });
    }
  };

  const remove = async () => {
    if (!name || isNew) return;
    if (!confirm(`确定删除专栏 "${name}"？`)) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) onDeleted(name);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{isNew ? "新建专栏" : `编辑：${name}`}</h1>
        <div className="flex items-center gap-2">
          {!isNew && (
            <button onClick={remove} className="px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 inline-flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> 删除
            </button>
          )}
          <button onClick={save} disabled={saving} className="px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            保存
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-3 py-2 rounded text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
          {msg.text}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">名称</label>
          <input
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">短描述</label>
          <textarea
            rows={2}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">背景预设</label>
            <select
              value={formBg}
              onChange={(e) => setFormBg(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]"
            >
              <option value="">（无）</option>
              {BG_PRESETS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">背景透明度（0-100）</label>
            <input
              type="number"
              min={0} max={100}
              value={formOpacity}
              onChange={(e) => setFormOpacity(Number(e.target.value))}
              className="w-full px-4 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-1">封面图片</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formCover}
              onChange={(e) => setFormCover(e.target.value)}
              placeholder="/images/covers/category.png"
              className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm placeholder:text-[var(--muted)]/50"
            />
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                fd.append("type", "blog");
                const res = await fetch("/api/upload", { method: "POST", body: fd });
                const data = await res.json();
                if (data.success && data.url) setFormCover(data.url);
              }}
              className="hidden"
              id="category-cover-upload"
            />
            <label
              htmlFor="category-cover-upload"
              className="px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer shrink-0"
            >
              上传
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm text-[var(--muted)] mb-2">详细描述（用于专栏详情页）</label>
          <MarkdownEditor
            value={formLongDesc}
            onChange={setFormLongDesc}
            placeholder="描述这个专栏的内容定位、目标读者、阅读顺序等…"
            uploadMeta={{ type: "category", category: formName || "未命名" }}
            draftKey={draftKey}
          />
        </div>
      </div>
    </div>
  );
}
