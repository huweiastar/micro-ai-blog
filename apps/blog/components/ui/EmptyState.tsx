import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    href: string;
  };
}

export function EmptyState({
  title = "暂无内容",
  description,
  icon: Icon = Inbox,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon className="mb-4 h-12 w-12 text-[var(--muted)]/50" />
      <p className="mb-2 text-lg text-[var(--muted)]">{title}</p>
      {description && (
        <p className="mb-6 text-sm text-[var(--muted)]">{description}</p>
      )}
      {action && (
        <Button href={action.href} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
}
