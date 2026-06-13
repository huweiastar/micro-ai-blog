import { clsx } from "clsx";

type Tone =
  | "primary"
  | "accent"
  | "muted"
  | "success"
  | "warning"
  | "danger"
  | "info";

const tones: Record<Tone, string> = {
  primary: "bg-[var(--primary)]/10 text-[var(--primary)]",
  accent: "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20",
  muted: "bg-[var(--card)] text-[var(--muted)] border border-[var(--card-border)]",
  success: "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20",
  warning: "bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20",
  danger: "bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20",
  info: "bg-[var(--info)]/10 text-[var(--info)] border border-[var(--info)]/20",
};

interface BadgeProps {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "primary", className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
