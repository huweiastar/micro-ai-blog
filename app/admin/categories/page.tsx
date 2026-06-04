"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

type CategoryConfig = {
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
};

export default function CategoriesPage() {
  // Categories state
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [categoryResult, setCategoryResult] = useState<{ success: boolean; message: string } | null>(null);
  const [newCategoryBg, setNewCategoryBg] = useState("");
  const [newCategoryOpacity, setNewCategoryOpacity] = useState(15);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // Category management
  const addCategory = async () => {
    if (!newCategoryName.trim()) { setCategoryResult({ success: false, message: "请输入专栏名称" }); return; }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName, description: newCategoryDesc, background: newCategoryBg || undefined, bgOpacity: newCategoryOpacity }),
    });
    const data = await res.json();
    setCategoryResult(data);
    if (data.success) {
      setCategories([...categories, { name: newCategoryName, description: newCategoryDesc, background: newCategoryBg || undefined, bgOpacity: newCategoryOpacity }]);
      setNewCategoryName(""); setNewCategoryDesc(""); setNewCategoryBg(""); setNewCategoryOpacity(15);
    }
    setTimeout(() => setCategoryResult(null), 3000);
  };

  const deleteCategory = async (name: string) => {
    if (!confirm(`确定删除专栏「${name}」吗？`)) return;
    const res = await fetch("/api/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    if (data.success) setCategories(categories.filter((c) => c.name !== name));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">专栏管理</h1>
      <div className="space-y-8">
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">添加专栏</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1"><label className="block text-sm text-[var(--muted)] mb-1">专栏名称 <span className="text-red-400">*</span></label><input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="如：大模型安全" className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50" /></div>
              <div className="sm:col-span-2"><label className="block text-sm text-[var(--muted)] mb-1">简介</label><input type="text" value={newCategoryDesc} onChange={(e) => setNewCategoryDesc(e.target.value)} placeholder="专栏简介" className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50" /></div>
            </div>

            {categoryResult && (
              <div className={`p-3 rounded-lg text-sm ${categoryResult.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{categoryResult.message}</div>
            )}
            <button onClick={addCategory} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <Plus className="w-4 h-4" />添加专栏
            </button>
          </div>
        </div>

        {/* Category List */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">已添加的专题 ({categories.length})</h2>
          <div className="space-y-3">
            {categories.length === 0 && <p className="text-[var(--muted)] text-sm">还没有专栏</p>}
            {categories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
                <Link href={`/categories/${encodeURIComponent(cat.name)}`} className="flex-1 group">
                  <h3 className="font-medium group-hover:text-[var(--primary)] transition-colors">{cat.name}</h3>
                  {cat.description && <p className="text-sm text-[var(--muted)]">{cat.description}</p>}
                </Link>
                <button onClick={() => deleteCategory(cat.name)} className="p-2 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="删除">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
