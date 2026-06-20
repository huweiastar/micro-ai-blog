import { HeartHandshake } from "lucide-react";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { EmptyState } from "../../components/ui/EmptyState";
import { FriendsDrift } from "../../components/friends/FriendsDrift";
import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
import { getAllFriends } from "../../lib/friends";
import type { Metadata } from "next";

const siteUrl = getSiteUrl();

export const metadata: Metadata = generatePageMetadata({
  title: "友链",
  description: "漂流瓶里的朋友们",
  url: siteUrl + "/friends",
});

export default function FriendsPage() {
  const friends = getAllFriends();

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
            description="可以在 content/friends.yaml 中添加朋友。"
          />
        ) : (
          <FriendsDrift friends={friends} />
        )}
      </Container>
    </>
  );
}
