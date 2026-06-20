import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { Comment } from "../../components/Comment";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "留言板",
  description: "有什么想说的、想问的、想吐槽的，都可以留在这里",
});

/**
 * 留言板：复用 giscus（data-mapping=pathname 自动按 /guestbook 独立成一条讨论，
 * 与文章评论互不干扰）。未配置 giscus 时 Comment 内部自带兜底提示。
 */
export default function GuestbookPage() {
  return (
    <>
      <PageHeader
        title="留言板"
        description="有什么想说的、想问的、想吐槽的，都可以留在这里 👋"
      />
      <Container size="prose" className="pb-16">
        <Comment slug="guestbook" title="留言板" />
      </Container>
    </>
  );
}
