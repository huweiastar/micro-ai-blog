import { Container } from "./Container";

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  countLabel?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  count,
  countLabel = "篇",
  children,
}: PageHeaderProps) {
  return (
    <Container className="py-10 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-2 text-[var(--muted)]">{description}</p>
          )}
          {typeof count === "number" && (
            <p className="mt-1 text-sm text-[var(--muted)]">
              共 {count} {countLabel}
            </p>
          )}
        </div>
        {children}
      </div>
    </Container>
  );
}
