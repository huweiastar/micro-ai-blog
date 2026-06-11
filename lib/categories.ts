import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { atomicWriteFile } from "./atomic-file";
import { getAllPostsSync } from "./posts";

const categoriesPath = path.join(process.cwd(), "content/categories.yaml");

export type CategoryConfig = {
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
  description_long?: string;
  cover?: string;
  draft?: boolean;          // 草稿：仅后台可见，不在公开页面展示
};

// 读取全部专栏配置（含草稿）——仅供后台 / API 使用。
export function getCategoryConfigs(): CategoryConfig[] {
  if (!fs.existsSync(categoriesPath)) return [];
  const content = fs.readFileSync(categoriesPath, "utf-8");
  return (yaml.load(content, { schema: yaml.DEFAULT_SCHEMA }) as CategoryConfig[]) || [];
}

export type Category = CategoryConfig & {
  count: number;
};

// 公开专栏：过滤掉草稿。所有面向访客的页面都应使用此函数。
export function getAllCategories(): Category[] {
  const configs = getCategoryConfigs().filter((c) => !c.draft);
  const posts = getAllPostsSync();

  const countMap = new Map<string, number>();
  posts.forEach((post) => {
    countMap.set(post.category, (countMap.get(post.category) || 0) + 1);
  });

  return configs.map((config) => ({
    ...config,
    count: countMap.get(config.name) || 0,
  }));
}

export function getCategoryByName(name: string): Category | null {
  return getAllCategories().find((c) => c.name === name) || null;
}

export function saveCategoryConfigs(configs: CategoryConfig[]) {
  const content = yaml.dump(configs, { lineWidth: 1000 });
  atomicWriteFile(categoriesPath, content);
}
