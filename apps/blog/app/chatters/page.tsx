import Link from "next/link";
import Image from "next/image";
import { getAllChattersSync } from "../../lib/chatters";
import { GlassCard } from "../../components/ui/GlassCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { Container } from "../../components/ui/Container";
import { RevealList } from "../../components/RevealList";
import { Tag } from "../../components/Tag";
import { formatShortDate } from "../../lib/utils";
import { generatePageMetadata } from "../../lib/seo";
import { MessageSquareText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = generatePageMetadata({
  title: "杂谈",
  description: "比说说长、比博客随意的碎碎念",
  url: "/chatters",
});

export default function ChattersPage() {
  const chatters = getAllChattersSync();

  return (
    <>
      <PageHeader title="杂谈" description="比说说长、比博客随意的碎碎念" count={chatters.length} countLabel="篇" />
      <Container className="pb-16">
        {chatters.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--card-border)] bg-[var(--card)] px-6 py-20 text-center">
            <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-[var(--muted)]/60" />
            <p className="text-sm text-[var(--muted)]">
              还没有杂谈，往 <code className="font-mono">content/chatters/</code> 添加 .mdx 即可。
            </p>
          </div>
        ) : (
          <RevealList className="grid gap-5 sm:grid-cols-2">
            {chatters.map((c) => (
              <GlassCard key={c.slug} as="article" hover className="overflow-hidden">
                <Link href={`/chatters/${c.slug}`} className="block">
                  {c.cover && (
                    <Image
                      src={c.cover}
                      alt={c.title}
                      width={400}
                      height={160}
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <div className="p-5 pb-0">
                    <div className="mb-2 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <time>{formatShortDate(c.date)}</time>
                      {c.mood && (
                        <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[var(--primary)]">{c.mood}</span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">{c.title}</h2>
                    {c.summary && (
                      <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{c.summary}</p>
                    )}
                  </div>
                </Link>
                {/* 标签放在卡片 Link 之外，避免 <a> 嵌套 <a> 的水合错误 */}
                {c.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-5 pb-5 pt-3">
                    {c.tags.map((t) => (
                      <Tag key={t} name={t} />
                    ))}
                  </div>
                )}
              </GlassCard>
            ))}
          </RevealList>
        )}
      </Container>
    </>
  );
}
