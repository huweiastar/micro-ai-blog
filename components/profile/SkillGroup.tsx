interface SkillGroupProps {
  title: string;
  items: string[];
}

export function SkillGroup({ title, items }: SkillGroupProps) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="px-3 py-1.5 rounded-lg text-sm bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)]"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
