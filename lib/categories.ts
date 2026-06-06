import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { getAllPostsSync } from "./posts";

const categoriesPath = path.join(process.cwd(), "content/categories.yaml");

export type CategoryConfig = {
  name: string;
  description: string;
  background?: string;
  bgOpacity?: number;
  description_long?: string;
  cover?: string;
};

export function getCategoryConfigs(): CategoryConfig[] {
  if (!fs.existsSync(categoriesPath)) return [];
  const content = fs.readFileSync(categoriesPath, "utf-8");
  return (yaml.load(content, { schema: yaml.DEFAULT_SCHEMA }) as CategoryConfig[]) || [];
}

export type Category = CategoryConfig & {
  count: number;
};

export function getAllCategories(): Category[] {
  const configs = getCategoryConfigs();
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
  fs.writeFileSync(categoriesPath, content, "utf-8");
}
