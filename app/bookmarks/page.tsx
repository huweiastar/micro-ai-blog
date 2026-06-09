import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { BookmarksList } from "../../components/blog/BookmarksList";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "我的收藏",
  description: "你在本站收藏的文章（保存在本地浏览器）",
});

export default function BookmarksPage() {
  return (
    <>
      <PageHeader
        title="我的收藏"
        description="收藏保存在本地浏览器，仅你可见"
      />
      <Container className="pb-12">
        <BookmarksList />
      </Container>
    </>
  );
}
