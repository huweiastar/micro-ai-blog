import { StickyNote } from "lucide-react";
import { getAllNotesSync, renderMarkdownToHtml } from "../../lib/posts";
import { NoteCard } from "../../components/notes/NoteCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { formatDate } from "../../lib/utils";
import { isGiscusConfigured } from "../../config/comments";
import { generatePageMetadata, getSiteUrl } from "../../lib/seo";
import type { Metadata } from "next";

const siteUrl = getSiteUrl();

export const metadata: Metadata = generatePageMetadata({
  title: "随手记",
  description: "学习过程中的碎片记录与即时思考",
  url: `${siteUrl}/notes`,
});

export default async function NotesPage() {
  const notes = getAllNotesSync();
  const commentsEnabled = isGiscusConfigured();
  const rendered = await Promise.all(
    notes.map(async (note) => ({
      ...note,
      html: await renderMarkdownToHtml(note.content),
    }))
  );

  return (
    <>
      <PageHeader
        title="随手记"
        description="学习过程中的碎片记录与即时思考"
        count={notes.length}
        countLabel="条"
      />
      <Container className="pb-12 max-w-3xl">
        {rendered.length === 0 ? (
          <div className="text-center py-20 text-[var(--muted)]">
            <StickyNote className="w-10 h-10 mx-auto mb-4 opacity-50" />
            <p>还没有随手记，第一条碎片想法正在路上。</p>
          </div>
        ) : (
          <div className="relative ml-3 space-y-8 border-l border-[var(--card-border)]">
            {rendered.map((note) => (
              <div key={note.slug} className="relative pl-6 sm:pl-8">
                <span className="absolute -left-[5px] top-7 h-2.5 w-2.5 rounded-full bg-amber-400 ring-4 ring-[var(--background)]" />
                <NoteCard
                  slug={note.slug}
                  date={note.date}
                  dateLabel={formatDate(note.date)}
                  tags={note.tags}
                  html={note.html}
                  commentsEnabled={commentsEnabled}
                />
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
