import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-[var(--card-border)] bg-[var(--card)] p-6",
        hover &&
          "transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]",
        className
      )}
    >
      {children}
    </div>
  );
}
