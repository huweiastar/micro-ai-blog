"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useThemeConfig } from "../../components/ThemeContext";
import {
  Camera, Check, Save, Plus, Trash2,
  Image as ImageIcon, X, LogOut, Pencil, Edit3,
} from "lucide-react";
import { BioEditor } from "../../components/BioEditor";

type CategoryConfig = {
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
};

type CodeIndexConfig = {
  enabled: boolean;
  sourceType?: "github" | "local";
  repoUrl?: string;
  branch?: string;
  localPath?: string;
  include?: string[];
  exclude?: string[];
};

type Project = {
  slug: string;
  name: string;
  description: string;
  techStack: string[];
  highlights: string[];
  githubUrl: string;
  demoUrl: string;
  image: string;
  relatedPosts: string[];
  cover?: string;
  details?: Record<string, string>;
  codeIndex?: CodeIndexConfig;
};

type SkillGroup = { title: string; items: string[] };

export default function AdminPage() {
  const { setTheme: setGlobalTheme } = useThemeConfig();
  const [activeTab, setActiveTab] = useState<"about" | "categories" | "projects" | "theme">("about");

  // Theme state
  const [themeBgImage, setThemeBgImage] = useState("");
  const [themeBgOpacity, setThemeBgOpacity] = useState(50);
  const [themeEffect, setThemeEffect] = useState("ink");
  const [themeSaved, setThemeSaved] = useState(false);
  const [bgImageHistory, setBgImageHistory] = useState<string[]>([]);

  // About (profile) state
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [aboutName, setAboutName] = useState("");
  const [aboutBio, setAboutBio] = useState("");
  const [aboutEmail, setAboutEmail] = useState("");
  const [aboutGithub, setAboutGithub] = useState("");
  const [aboutSkills, setAboutSkills] = useState<SkillGroup[]>([]);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutResult, setAboutResult] = useState<{ success: boolean; message: string } | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<{ groupIndex: number; name: string } | null>(null);
  const [newSkillText, setNewSkillText] = useState("");
  const [addingSkillForGroup, setAddingSkillForGroup] = useState<number | null>(null);

  // Categories state
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDesc, setNewCategoryDesc] = useState("");
  const [categoryResult, setCategoryResult] = useState<{ success: boolean; message: string } | null>(null);
  const [newCategoryBg, setNewCategoryBg] = useState("");
  const [newCategoryOpacity, setNewCategoryOpacity] = useState(15);

  // Projects state
  const [projects, setProjects] = useState<Project[]>([]);

  // Load about data from profile.yaml
  useEffect(() => {
    fetch("/api/about")
      .then((res) => res.json())
      .then((data) => {
        setAboutName(data.name || "");
        // Merge bio and bio2 into a single field (separated by blank line)
        const combined = [data.bio, data.bio2].filter(Boolean).join("\n\n");
        setAboutBio(combined || "");
        setAboutEmail(data.email || "");
        setAboutGithub(data.github || "");
        setAboutSkills(data.skills || []);
        try {
          const savedAvatar = localStorage.getItem("blog-avatar");
          setAvatar(savedAvatar || data.avatar || "");
          setAvatarPreview(savedAvatar || data.avatar || "");
        } catch {}
      })
      .catch(() => {});
  }, []);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  // Load projects
  useEffect(() => {
    fetch("/api/projects")
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => {});
  }, []);

  // Load theme
  useEffect(() => {
    fetch("/api/theme")
      .then((res) => res.json())
      .then((data) => {
        setThemeBgImage(data.backgroundImage || "");
        setThemeBgOpacity(data.backgroundOpacity ?? 50);
        setThemeEffect(data.effectStyle || "ink");
      })
      .catch(() => {});

    try {
      const history = localStorage.getItem("bg-image-history");
      if (history) setBgImageHistory(JSON.parse(history));
    } catch {}
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { alert("图片不能超过 5MB"); return; }

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        setAvatar(data.url);
        setAvatarPreview(data.url);
        localStorage.setItem("blog-avatar", data.url);
      } else {
        alert(data.error || "上传失败");
      }
    } catch {
      alert("上传失败，请重试");
    }

    if (e.target) e.target.value = "";
  };

  const saveAbout = async () => {
    const res = await fetch("/api/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: aboutName,
        bio: aboutBio,
        email: aboutEmail,
        github: aboutGithub,
        skills: aboutSkills,
      }),
    });
    const data = await res.json();
    setAboutResult(data);
    if (data.success) {
      setAboutSaved(true);
      setTimeout(() => setAboutSaved(false), 2000);
    }
    setTimeout(() => setAboutResult(null), 3000);
  };

  const saveTheme = async () => {
    const themeData = { backgroundImage: themeBgImage, backgroundOpacity: themeBgOpacity, effectStyle: themeEffect };
    const res = await fetch("/api/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(themeData),
    });
    const data = await res.json();
    if (data.success) {
      setGlobalTheme(themeData as any);
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 2000);
    }
  };

  const addToHistory = (url: string) => {
    setBgImageHistory((prev) => {
      const next = [url, ...prev.filter((u) => u !== url)].slice(0, 12);
      localStorage.setItem("bg-image-history", JSON.stringify(next));
      return next;
    });
  };

  const uploadThemeBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "theme-bg");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      setThemeBgImage(data.url);
      addToHistory(data.url);
    }
  };

  // About skill management
  const addSkillGroup = () => {
    setAboutSkills([...aboutSkills, { title: "新分类", items: [] }]);
  };

  const removeSkillGroup = (index: number) => {
    const name = aboutSkills[index]?.title;
    if (name && !confirm(`确定删除「${name}」分组吗？`)) return;
    setAboutSkills(aboutSkills.filter((_, i) => i !== index));
  };

  const renameSkillGroup = (index: number, newName: string) => {
    if (!newName.trim()) { setEditingGroupName(null); return; }
    const updated = [...aboutSkills];
    updated[index] = { ...updated[index], title: newName.trim() };
    setAboutSkills(updated);
    setEditingGroupName(null);
  };

  const addSkill = (groupIndex: number) => {
    if (!newSkillText.trim()) return;
    const updated = [...aboutSkills];
    updated[groupIndex] = { ...updated[groupIndex], items: [...updated[groupIndex].items, newSkillText.trim()] };
    setAboutSkills(updated);
    setNewSkillText("");
    setAddingSkillForGroup(null);
  };

  const removeSkill = (groupIndex: number, skillIndex: number) => {
    const updated = [...aboutSkills];
    updated[groupIndex] = { ...updated[groupIndex], items: updated[groupIndex].items.filter((_, i) => i !== skillIndex) };
    setAboutSkills(updated);
  };

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

  // Project management
  const deleteProject = async (slug: string) => {
    if (!confirm("确定删除该项目吗？")) return;
    const res = await fetch("/api/projects", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) });
    const data = await res.json();
    if (data.success) setProjects(projects.filter((p) => p.slug !== slug));
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">后台管理</h1>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 transition-colors"
          title="退出登录"
        >
          <LogOut className="w-4 h-4" /> 退出
        </button>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[var(--card-border)] pb-4 flex-wrap">
        {[
          { id: "about" as const, label: "关于我" },
          { id: "categories" as const, label: "专栏管理" },
          { id: "projects" as const, label: "项目管理" },
          { id: "theme" as const, label: "主题设置" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"}`}
          >
            {tab.label}
          </button>
        ))}
        <a
          href="/admin/project"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          编辑项目 &rarr;
        </a>
        <a
          href="/admin/write"
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          写文章 &rarr;
        </a>
      </div>

      {/* About / Profile Tab */}
      {activeTab === "about" && (
        <div className="space-y-8">
          {/* Avatar */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">头像</h2>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--card)] flex items-center justify-center border border-[var(--card-border)]">
                {avatarPreview ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-[var(--primary)]">{aboutName?.charAt(0) || "微"}</span>} {/* eslint-disable-line @next/next/no-img-element */}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 cursor-pointer transition-colors">
                <Camera className="w-4 h-4" />更换头像
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">基本信息</h2>
            <div className="space-y-4">
              <div><label className="block text-sm text-[var(--muted)] mb-1">昵称</label><input type="text" value={aboutName} onChange={(e) => setAboutName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-sm text-[var(--muted)] mb-1">邮箱</label><input type="email" value={aboutEmail} onChange={(e) => setAboutEmail(e.target.value)} placeholder="your-email@example.com" className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50" /></div>
                <div><label className="block text-sm text-[var(--muted)] mb-1">GitHub</label><input type="text" value={aboutGithub} onChange={(e) => setAboutGithub(e.target.value)} placeholder="https://github.com/your-name" className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50" /></div>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">个人简介</h2>
            <BioEditor
              label="简介内容（支持 Markdown）"
              value={aboutBio}
              onChange={setAboutBio}
            />
          </div>

          {/* Skills */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">技术栈分组 ({aboutSkills.length})</h2>

            {aboutResult && (
              <div className={`p-3 rounded-lg text-sm mb-4 ${aboutResult.success ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                {aboutResult.message}
              </div>
            )}

            <div className="space-y-4">
              {aboutSkills.map((group, gi) => (
                <div key={group.title + gi} className="p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
                  <div className="flex items-center justify-between mb-3">
                    {editingGroupName?.groupIndex === gi ? (
                      <input
                        type="text"
                        defaultValue={group.title}
                        className="px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameSkillGroup(gi, (e.target as HTMLInputElement).value);
                          if (e.key === "Escape") setEditingGroupName(null);
                        }}
                        onBlur={(e) => renameSkillGroup(gi, e.target.value)}
                      />
                    ) : (
                      <button
                        className="font-medium text-sm hover:text-[var(--primary)] transition-colors inline-flex items-center gap-1"
                        onClick={() => setEditingGroupName({ groupIndex: gi, name: group.title })}
                        title="点击编辑分组名称"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> {group.title}
                      </button>
                    )}
                    <button onClick={() => removeSkillGroup(gi)} className="p-1.5 rounded text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="删除分组">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {group.items.map((skill, si) => (
                      <span key={si} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)]">
                        {skill}
                        <button onClick={() => removeSkill(gi, si)} className="hover:text-red-400 transition-colors" title="删除">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {addingSkillForGroup === gi ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSkillText}
                        onChange={(e) => setNewSkillText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addSkill(gi); if (e.key === "Escape") { setAddingSkillForGroup(null); setNewSkillText(""); } }}
                        placeholder="输入技能名称"
                        className="flex-1 px-3 py-1.5 rounded border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                        autoFocus
                      />
                      <button onClick={() => addSkill(gi)} className="px-3 py-1.5 rounded border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setAddingSkillForGroup(null); setNewSkillText(""); }} className="px-3 py-1.5 rounded border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-red-400 hover:border-red-500/30 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingSkillForGroup(gi)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />添加技能
                    </button>
                  )}
                </div>
              ))}

              {aboutSkills.length === 0 && (
                <p className="text-[var(--muted)] text-sm">还没有技能分组</p>
              )}

              <button onClick={addSkillGroup} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <Plus className="w-4 h-4" />添加分组
              </button>
            </div>
          </div>

          <button onClick={saveAbout} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
            {aboutSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {aboutSaved ? "已保存" : "保存"}
          </button>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
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
      )}

      {/* Projects Tab */}
      {activeTab === "projects" && (
        <div className="space-y-8">
          {/* Link to project editor */}
          <div className="glass rounded-xl p-6 text-center">
            <p className="text-sm text-[var(--muted)] mb-4">使用 Markdown 编辑器管理项目详情、封面和技术栈</p>
            <Link href="/admin/project" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors">
              <Pencil className="w-4 h-4" />进入项目编辑器
            </Link>
          </div>

          {/* Project List */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">已添加的项目 ({projects.length})</h2>
            <div className="space-y-3">
              {projects.length === 0 && <p className="text-[var(--muted)] text-sm">还没有项目</p>}
              {projects.map((p) => (
                <div key={p.slug} className="flex items-center justify-between p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
                  <Link href={`/projects/${p.slug}`} className="flex-1 group">
                    <h3 className="font-medium group-hover:text-[var(--primary)] transition-colors">{p.name}</h3>
                    <p className="text-sm text-[var(--muted)]">{p.description}</p>
                    <div className="flex gap-2 mt-1">{p.techStack.slice(0, 4).map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)]">{t}</span>)}</div>
                  </Link>
                  <button onClick={() => deleteProject(p.slug)} className="p-2 rounded-lg text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="删除"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theme Tab */}
      {activeTab === "theme" && (
        <div className="space-y-8">
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">背景设置</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">背景图片</label>
                <div className="flex items-center gap-4">
                  {themeBgImage ? (
                    <div className="relative w-40 h-24 rounded-lg overflow-hidden border border-[var(--card-border)]">
                      <img src={themeBgImage} alt="背景预览" className="w-full h-full object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
                      <button onClick={() => setThemeBgImage("")} className="absolute top-1 right-1 p-1 rounded bg-black/50 text-white hover:bg-black/70"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <div className="w-40 h-24 rounded-lg border-2 border-dashed border-[var(--card-border)] flex items-center justify-center text-[var(--muted)] text-xs">
                      暂无背景
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 cursor-pointer transition-colors">
                      <ImageIcon className="w-4 h-4" />上传图片
                      <input type="file" accept="image/*" onChange={uploadThemeBg} className="hidden" />
                    </label>
                    <p className="text-xs text-[var(--muted)]">推荐尺寸 1920x1080，支持 PNG/JPG</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">或输入图片链接</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={themeBgImage}
                    onChange={(e) => setThemeBgImage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && themeBgImage.trim()) { addToHistory(themeBgImage.trim()); } }}
                    placeholder="https://example.com/bg.jpg"
                    className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
                  />
                  <button
                    onClick={() => { if (themeBgImage.trim()) addToHistory(themeBgImage.trim()); }}
                    className="px-3 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
                    title="添加到历史记录"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Background Image History */}
              {bgImageHistory.length > 0 && (
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-2">历史背景</label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {bgImageHistory.map((url, i) => (
                      <button
                        key={`${url}-${i}`}
                        onClick={() => setThemeBgImage(url)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${themeBgImage === url ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/30" : "border-[var(--card-border)]"}`}
                      >
                        <img src={url} alt={`历史背景 ${i + 1}`} className="w-full h-16 object-cover" /> {/* eslint-disable-line @next/next/no-img-element */}
                        {themeBgImage === url && (
                          <div className="absolute inset-0 bg-[var(--primary)]/20 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { if (confirm("确定清空所有历史背景？")) { setBgImageHistory([]); localStorage.removeItem("bg-image-history"); } }}
                    className="text-xs text-[var(--muted)] hover:text-red-400 mt-2 transition-colors"
                  >
                    清空历史
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm text-[var(--muted)] mb-2">背景透明度：{themeBgOpacity}%</label>
                <input type="range" min="1" max="50" value={themeBgOpacity} onChange={(e) => setThemeBgOpacity(Number(e.target.value))} className="w-full accent-[var(--primary)]" />
                <div className="flex justify-between text-xs text-[var(--muted)] mt-1">
                  <span>极淡</span>
                  <span>较深</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">点击特效</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "ink", name: "墨水溅射", desc: "墨滴四溅" },
                { id: "sparkle", name: "星星闪烁", desc: "星光飞散" },
                { id: "ripple", name: "波纹扩散", desc: "水波涟漪" },
                { id: "none", name: "无特效", desc: "关闭特效" },
              ].map((eff) => (
                <button
                  key={eff.id}
                  onClick={() => setThemeEffect(eff.id)}
                  className={`p-4 rounded-xl border-2 text-center transition-all ${themeEffect === eff.id ? "border-[var(--primary)] bg-[var(--primary)]/5" : "border-[var(--card-border)] hover:border-[var(--primary)]/30"}`}
                >
                  <p className="font-medium text-sm">{eff.name}</p>
                  <p className="text-xs text-[var(--muted)] mt-1">{eff.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button onClick={saveTheme} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
            {themeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {themeSaved ? "已保存" : "保存主题"}
          </button>
        </div>
      )}

    </div>
  );
}
