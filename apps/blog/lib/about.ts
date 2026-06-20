import fs from "fs";
import path from "path";
import { contentDir } from "./paths";
import yaml from "js-yaml";
import { atomicWriteFile } from "./atomic-file";
import type { AboutProfile } from "../types/about";

const profilePath = path.join(contentDir(), "about/profile.yaml");

const DEFAULT_PROFILE: AboutProfile = {
  name: "微观AI",
  avatar: "/images/avatar/avatar.webp",
  bio: "",
  bio2: "",
  email: "",
  github: "",
  tagline: "大数据研发工程师 · LLM · Agent · 量化投资",
  skills: [],
  techStack: [
    { name: "Python", icon: "code" },
    { name: "SQL", icon: "database" },
    { name: "Spark", icon: "zap" },
    { name: "LLM", icon: "brain" },
    { name: "RAG", icon: "layers" },
    { name: "多模态", icon: "sparkles" },
  ],
};

export function getAboutProfile(): AboutProfile {
  if (!fs.existsSync(profilePath)) return DEFAULT_PROFILE;
  const content = fs.readFileSync(profilePath, "utf-8");
  const data = yaml.load(content, { schema: yaml.DEFAULT_SCHEMA });
  // 与默认值合并：保证旧的 profile.yaml（无 techStack 字段）也能拿到首页默认标签
  return { ...DEFAULT_PROFILE, ...(data as Partial<AboutProfile>) };
}

export function saveAboutProfile(profile: AboutProfile) {
  const content = yaml.dump(profile, { lineWidth: 1000 });
  atomicWriteFile(profilePath, content);
}
