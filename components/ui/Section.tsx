import Link from "next/link";
import { Container } from "./Container";

interface SectionProps {
  title: string;
  moreHref?: string;
  moreLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({
  title,
  moreHref,
  moreLabel = "查看全部",
  children,
  className,
}: SectionProps) {
  return (
    <Container as="section" className={className}>
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {moreHref && (
          <Link
            href={moreHref}
            className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:underline"
          >
            {moreLabel} →
          </Link>
        )}
      </div>
      {children}
    </Container>
  );
}
