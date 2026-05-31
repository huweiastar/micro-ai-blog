interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-[var(--muted)] text-lg mb-2">{title || "暂无内容"}</p>
      {description && (
        <p className="text-[var(--muted)] text-sm mb-6">{description}</p>
      )}
      {action && (
        <a
          href={action.href}
          className="px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors"
        >
          {action.label}
        </a>
      )}
    </div>
  );
}
