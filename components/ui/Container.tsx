import { clsx } from "clsx";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "main" | "header" | "footer";
}

export function Container({ children, className, as: Tag = "div" }: ContainerProps) {
  return (
    <Tag className={clsx("mx-auto w-full max-w-5xl px-4 sm:px-6", className)}>
      {children}
    </Tag>
  );
}
