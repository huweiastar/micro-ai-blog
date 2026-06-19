import Link from "next/link";
import { Github, Mail, Hash, StickyNote, Layers } from "lucide-react";
import { getCategoryStyle } from "../../lib/category-style";
import { formatShortDate } from "../../lib/utils";

interface ProfileLite {
  name: string;
  avatar?: string;
  tagline?: string;
  github?: string;
  email?: string;
}
interface Counted {
  name: string;
  count: number;
}
interface NoteLite {
  slug: string;
  title: string;
  date: string;
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
        <Icon className="h-4 w-4 text-[var(--primary)]" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 首页左栏：关于卡片 + 专栏快捷入口。lg+ sticky 显示，填充左侧留白。 */
export function LeftAside({
  profile,
  categories,
}: {
  profile: ProfileLite;
  categories: Counted[];
}) {
  return (
    <div className="sticky top-20 space-y-6">
      {/* 关于卡片 */}
      <section className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-5 text-center">
        {profile.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar}
            alt={profile.name}
            className="mx-auto mb-3 h-20 w-20 rounded-full object-cover ring-2 ring-[var(--primary)]/30"
          />
        )}
        <div className="text-base font-bold text-[var(--foreground)]">
          {profile.name}
        </div>
        {profile.tagline && (
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
            {profile.tagline}
          </p>
        )}
        <div className="mt-4 flex justify-center gap-2">
          {profile.github && (
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--muted)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            >
              <Github className="h-4 w-4" />
            </a>
          )}
          {profile.email && (
            <a
              href={`mailto:${profile.email}`}
              aria-label="Email"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--card-border)] text-[var(--muted)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
        </div>
      </section>

      {/* 专栏快捷入口 */}
      {categories.length > 0 && (
        <Panel title="专栏" icon={Layers}>
          <ul className="space-y-1">
            {categories.map((c) => (
              <li key={c.name}>
                <Link
                  href={`/categories/${encodeURIComponent(c.name)}`}
                  className="group flex items-center justify-between rounded-lg px-2 py-1.5 text-sm text-[var(--muted)] transition-colors hover:bg-[var(--primary)]/5 hover:text-[var(--foreground)]"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: getCategoryStyle(c.name).accent }}
                    />
                    {c.name}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-[var(--muted)]">
                    {c.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/** 首页右栏：热门标签 + 最新随手记。lg+ sticky 显示，填充右侧留白。 */
export function RightAside({
  tags,
  notes,
}: {
  tags: Counted[];
  notes: NoteLite[];
}) {
  return (
    <div className="sticky top-20 space-y-6">
      {tags.length > 0 && (
        <Panel title="热门标签" icon={Hash}>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <Link
                key={t.name}
                href={`/tags/${encodeURIComponent(t.name)}`}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card)] px-2.5 py-1 text-xs text-[var(--muted)] transition-colors hover:border-[var(--primary)]/50 hover:text-[var(--primary)]"
              >
                {t.name}
                <span className="font-mono tabular-nums opacity-70">{t.count}</span>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {notes.length > 0 && (
        <Panel title="最新随手记" icon={StickyNote}>
          <ul className="space-y-3">
            {notes.map((n) => (
              <li key={n.slug}>
                <Link
                  href={`/blog/${n.slug}`}
                  className="group block text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  <span className="line-clamp-2 group-hover:text-[var(--primary)]">
                    {n.title}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs tabular-nums opacity-70">
                    {formatShortDate(n.date)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
