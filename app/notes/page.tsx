import Link from "next/link";
import { StickyNote } from "lucide-react";
import { getAllNotesSync, renderMarkdownToHtml } from "../../lib/posts";
import { Tag } from "../../components/Tag";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { formatDate } from "../../lib/utils";
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
          <div className="relative border-l border-[var(--card-border)] ml-3 space-y-10">
            {rendered.map((note) => (
              <article key={note.slug} className="relative pl-8">
                <span className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-[var(--primary)]" />
                <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-[var(--muted)]">
                  <Link
                    href={`/blog/${note.slug}`}
                    className="hover:text-[var(--primary)] transition-colors"
                    title="查看这条随手记"
                  >
                    <time dateTime={note.date}>{formatDate(note.date)}</time>
                  </Link>
                  {note.tags.map((tag) => (
                    <Tag key={tag} name={tag} />
                  ))}
                </div>
                <div
                  className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: note.html }}
                />
              </article>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
