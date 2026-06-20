interface SkillGroupProps {
  title: string;
  items: string[];
  /** 色族序号，按组轮换站点色系。 */
  hueIndex?: number;
}

// 站点冷色家族轮换（Tailwind 需要静态类名）
const HUES = [
  { dot: "from-indigo-500 to-blue-500", chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20" },
  { dot: "from-violet-500 to-fuchsia-500", chip: "bg-violet-500/10 text-violet-600 dark:text-violet-300 hover:bg-violet-500/20" },
  { dot: "from-sky-400 to-cyan-500", chip: "bg-sky-500/10 text-sky-600 dark:text-sky-300 hover:bg-sky-500/20" },
  { dot: "from-teal-500 to-emerald-500", chip: "bg-teal-500/10 text-teal-600 dark:text-teal-300 hover:bg-teal-500/20" },
  { dot: "from-fuchsia-500 to-pink-500", chip: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300 hover:bg-fuchsia-500/20" },
  { dot: "from-rose-500 to-red-400", chip: "bg-rose-500/10 text-rose-600 dark:text-rose-300 hover:bg-rose-500/20" },
];

export function SkillGroup({ title, items, hueIndex = 0 }: SkillGroupProps) {
  const hue = HUES[hueIndex % HUES.length];
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]">
        <span aria-hidden className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${hue.dot}`} />
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${hue.chip}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
