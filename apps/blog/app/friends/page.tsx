import { HeartHandshake } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { EmptyState } from "../../components/ui/EmptyState";
import { FriendsDrift } from "../../components/friends/FriendsDrift";
import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
import { api } from "../../lib/api/client";
import type { Metadata } from "next";

const siteUrl = getSiteUrl();

export const metadata: Metadata = generatePageMetadata({
  title: "友链",
  description: "漂流瓶里的朋友们",
  url: siteUrl + "/friends",
});

export default async function FriendsPage() {
  // 从 API 获取数据，失败时回退到空列表
  let friends: Array<{
    name: string;
    url: string;
    description: string;
    avatar?: string;
    themeColor?: string;
  }> = [];

  try {
    const { items } = await api.friends.list();
    friends = items.map((f) => ({
      name: f.name,
      url: f.url,
      description: f.description || "这个朋友还没有留下介绍。",
      avatar: f.avatar || undefined,
      themeColor: f.themeColor || undefined,
    }));
  } catch (err) {
    console.error("Failed to fetch friends from API:", err);
    // 回退：API 不可用时显示空状态
  }

  return (
    <>
      <PageHeader
        title="友链"
        description="漂流瓶 · 每一封信笺都来自远方的朋友。"
        count={friends.length}
        countLabel="位"
      />
      <Container size="wide" className="pb-16">
        {friends.length === 0 ? (
          <EmptyState
            icon={HeartHandshake}
            title="还没有友链"
            description="可以在后台添加朋友。"
          />
        ) : (
          <FriendsDrift friends={friends} />
        )}
      </Container>
    </>
  );
}
