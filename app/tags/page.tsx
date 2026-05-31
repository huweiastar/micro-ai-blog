import { getAllTags } from "../../lib/posts";
import { Tag } from "../../components/Tag";
import { generatePageMetadata } from "../../lib/seo";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "标签",
  description: "所有文章标签",
});

export default function TagsPage() {
  const tags = getAllTags();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">文章标签</h1>

      <div className="flex flex-wrap gap-2.5">
        {tags.map((tag) => (
          <Tag key={tag.name} name={tag.name} count={tag.count} />
        ))}
      </div>
    </div>
  );
}
