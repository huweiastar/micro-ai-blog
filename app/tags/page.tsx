import { getAllTags } from "../../lib/posts";
import { Tag } from "../../components/Tag";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "标签",
  description: "所有文章标签",
});

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <>
      <PageHeader
        title="文章标签"
        description="按关键词检索文章"
        count={tags.length}
        countLabel="个标签"
      />
      <Container className="pb-12">
        <div className="flex flex-wrap gap-2.5">
          {tags.map((tag) => (
            <Tag key={tag.name} name={tag.name} count={tag.count} />
          ))}
        </div>
      </Container>
    </>
  );
}
