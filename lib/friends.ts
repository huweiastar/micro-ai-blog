import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const friendsPath = path.join(process.cwd(), "content/friends.yaml");

export type Friend = {
  name: string;
  url: string;
  description: string;
  avatar?: string;
  themeColor?: string;
  draft?: boolean;
};

type FriendsFile = {
  friends?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeFriend(value: unknown): Friend | null {
  if (!isRecord(value)) return null;

  const name = stringField(value.name);
  const url = stringField(value.url);
  if (!name || !url) return null;

  return {
    name,
    url,
    description: stringField(value.description) ?? "这个朋友还没有留下介绍。",
    avatar: stringField(value.avatar),
    themeColor: stringField(value.themeColor),
    draft: value.draft === true,
  };
}

export function getFriendConfigs(): Friend[] {
  if (!fs.existsSync(friendsPath)) return [];

  const content = fs.readFileSync(friendsPath, "utf-8");
  const data = yaml.load(content, {
    schema: yaml.DEFAULT_SCHEMA,
  }) as FriendsFile | null;
  const rawFriends = isRecord(data) ? data.friends : undefined;
  if (!Array.isArray(rawFriends)) return [];

  return rawFriends
    .map((item) => normalizeFriend(item))
    .filter((item): item is Friend => item !== null);
}

export function getAllFriends(): Friend[] {
  return getFriendConfigs().filter((friend) => !friend.draft);
}
