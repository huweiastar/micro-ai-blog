import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { atomicWriteFile } from "./atomic-file";
import type { AboutProfile } from "../types/about";

const profilePath = path.join(process.cwd(), "content/about/profile.yaml");

const DEFAULT_PROFILE: AboutProfile = {
  name: "微观AI",
  avatar: "/images/avatar/avatar.webp",
  bio: "",
  bio2: "",
  email: "",
  github: "",
  skills: [],
};

export function getAboutProfile(): AboutProfile {
  if (!fs.existsSync(profilePath)) return DEFAULT_PROFILE;
  const content = fs.readFileSync(profilePath, "utf-8");
  const data = yaml.load(content, { schema: yaml.DEFAULT_SCHEMA });
  return (data as AboutProfile) || DEFAULT_PROFILE;
}

export function saveAboutProfile(profile: AboutProfile) {
  const content = yaml.dump(profile, { lineWidth: 1000 });
  atomicWriteFile(profilePath, content);
}
