import { StickyNote } from "lucide-react";
import { getAllNotesSync, renderMarkdownToHtml } from "../../lib/posts";
import { getAboutProfile } from "../../lib/about";
import { PolaroidFeed } from "../../components/notes/PolaroidFeed";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { isGiscusConfigured } from "../../config/comments";
import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
import type { Metadata } from "next";

const siteUrl = getSiteUrl();

export const metadata: Metadata = generatePageMetadata({
  title: "说说",
  description: "碎片记录与即时思考",
  url: `${siteUrl}/notes`,
});

export default async function NotesPage() {
  const notes = getAllNotesSync();
  const profile = getAboutProfile();

  const noteItems = await Promise.all(
    notes.map(async (n) => {
      const html = await renderMarkdownToHtml(n.content);
      return {
        slug: n.slug,
        date: n.date,
        html,
        tags: n.tags,
        mood: n.mood,
        location: n.location,
        images: n.images,
      };
    })
  );

  return (
    <>
      <PageHeader title="说说" description="碎片记录与即时思考" count={notes.length} countLabel="条" />
      <Container size="prose" className="pb-12">
        <PolaroidFeed
          notes={noteItems}
          authorName={profile.name}
          avatar={profile.avatar}
        />
      </Container>
    </>
  );
}
