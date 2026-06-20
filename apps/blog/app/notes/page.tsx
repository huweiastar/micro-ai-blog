import { StickyNote } from "lucide-react";
import { getAllNotesSync, renderMarkdownToHtml } from "../../lib/posts";
import { getAboutProfile } from "../../lib/about";
import { NotesFeed } from "../../components/notes/NotesFeed";
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

function toPlainText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export default async function NotesPage() {
  const notes = getAllNotesSync();
  const profile = getAboutProfile();
  const commentsEnabled = isGiscusConfigured();

  const moments = await Promise.all(
    notes.map(async (n) => {
      const html = await renderMarkdownToHtml(n.content);
      return {
        slug: n.slug,
        date: n.date,
        html,
        plain: toPlainText(html),
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
        {moments.length === 0 ? (
          <div className="py-20 text-center text-[var(--muted)]">
            <StickyNote className="mx-auto mb-4 h-10 w-10 opacity-50" />
            <p>还没有说说，第一条碎片想法正在路上。</p>
          </div>
        ) : (
          <NotesFeed
            moments={moments}
            authorName={profile.name}
            avatar={profile.avatar}
            commentsEnabled={commentsEnabled}
          />
        )}
      </Container>
    </>
  );
}
