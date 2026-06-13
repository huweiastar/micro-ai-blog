"use client";

import { useState, useEffect } from "react";
import {
  Camera, Check, Save, Plus, Trash2,
  X, Edit3, ChevronUp, ChevronDown,
} from "lucide-react";
import { MarkdownEditor } from "../../../components/admin/MarkdownEditor";
import { useToast } from "../../../components/admin/Toast";
import { TECH_ICON_KEYS, TechIcon } from "../../../lib/tech-icons";
import { IconPicker } from "../../../components/admin/IconPicker";
import type { TechTag } from "../../../types/about";

type SkillGroup = { title: string; items: string[] };

export default function AboutPage() {
  const { show } = useToast();
  // About (profile) state
  const [avatar, setAvatar] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [aboutName, setAboutName] = useState("");
  const [aboutBio, setAboutBio] = useState("");
  const [aboutEmail, setAboutEmail] = useState("");
  const [aboutGithub, setAboutGithub] = useState("");
  const [aboutSkills, setAboutSkills] = useState<SkillGroup[]>([]);
  const [aboutTechStack, setAboutTechStack] = useState<TechTag[]>([]);
  const [aboutSaved, setAboutSaved] = useState(false);
  const [aboutResult, setAboutResult] = useState<{ success: boolean; message: string } | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<{ groupIndex: number; name: string } | null>(null);
  const [newSkillText, setNewSkillText] = useState("");
  const [addingSkillForGroup, setAddingSkillForGroup] = useState<number | null>(null);

  // Suppress unused warning — avatar value is mirrored in localStorage and used to keep state coherent
  void avatar;

  // Load about data from profile.yaml
  useEffect(() => {
    fetch("/api/about")
      .then((res) => res.json())
      .then((data) => {
        setAboutName(data.name || "");
        setAboutBio(data.bio || "");
        setAboutEmail(data.email || "");
        setAboutGithub(data.github || "");
        setAboutSkills(data.skills || []);
        setAboutTechStack(data.techStack || []);
        try {
          const savedAvatar = localStorage.getItem("blog-avatar");
          setAvatar(savedAvatar || data.avatar || "");
          setAvatarPreview(savedAvatar || data.avatar || "");
        } catch {}
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 5 * 1024 * 1024) { show("图片不能超过 5MB", "error"); return; }

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
        show("头像已更新", "success");
      } else {
        show(data.error || "上传失败", "error");
      }
    } catch {
      show("上传失败，请重试", "error");
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
        techStack: aboutTechStack,
      }),
    });
    const data = await res.json();
    setAboutResult(data);
    if (data.success) {
      setAboutSaved(true);
      show("保存成功", "success");
      setTimeout(() => setAboutSaved(false), 2000);
    } else {
      show(data.message || "保存失败", "error");
    }
    setTimeout(() => setAboutResult(null), 3000);
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

  // 首页技术栈标签管理
  const addTechTag = () => {
    setAboutTechStack([...aboutTechStack, { name: "新标签", icon: TECH_ICON_KEYS[0] }]);
  };

  const removeTechTag = (index: number) => {
    setAboutTechStack(aboutTechStack.filter((_, i) => i !== index));
  };

  const updateTechTagName = (index: number, name: string) => {
    const updated = [...aboutTechStack];
    updated[index] = { ...updated[index], name };
    setAboutTechStack(updated);
  };

  const updateTechTagIcon = (index: number, icon: string) => {
    const updated = [...aboutTechStack];
    updated[index] = { ...updated[index], icon };
    setAboutTechStack(updated);
  };

  const moveTechTag = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= aboutTechStack.length) return;
    const updated = [...aboutTechStack];
    [updated[index], updated[target]] = [updated[target], updated[index]];
    setAboutTechStack(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">关于我</h1>
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
          <p className="text-sm text-[var(--muted)] mb-2">简介内容（支持 Markdown，可分屏实时预览）</p>
          <MarkdownEditor
            value={aboutBio}
            onChange={setAboutBio}
            uploadMeta={{ type: "uploads" }}
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

        {/* 首页技术栈标签 */}
        <div className="glass rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-1">首页技术栈标签 ({aboutTechStack.length})</h2>
          <p className="text-sm text-[var(--muted)] mb-4">首页 Hero 区域展示的标签，可自定义名称、图标和顺序。</p>

          <div className="space-y-3">
            {aboutTechStack.map((tag, ti) => (
              <div key={ti} className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-[var(--primary)] shrink-0">
                  <TechIcon icon={tag.icon} className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={tag.name}
                  onChange={(e) => updateTechTagName(ti, e.target.value)}
                  placeholder="标签名称"
                  className="flex-1 min-w-[120px] px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                />
                <IconPicker value={tag.icon} onChange={(icon) => updateTechTagIcon(ti, icon)} />
                <div className="flex items-center gap-1">
                  <button onClick={() => moveTechTag(ti, -1)} disabled={ti === 0} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="上移">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => moveTechTag(ti, 1)} disabled={ti === aboutTechStack.length - 1} className="p-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="下移">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeTechTag(ti)} className="p-1.5 rounded text-[var(--muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors" title="删除标签">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {aboutTechStack.length === 0 && (
              <p className="text-[var(--muted)] text-sm">还没有技术栈标签</p>
            )}

            <button onClick={addTechTag} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
              <Plus className="w-4 h-4" />添加标签
            </button>
          </div>
        </div>

        <button onClick={saveAbout} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
          {aboutSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {aboutSaved ? "已保存" : "保存"}
        </button>
      </div>
    </div>
  );
}
