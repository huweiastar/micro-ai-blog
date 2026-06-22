"use client";

interface HeadingDialogProps {
  open: boolean;
  onClose: () => void;
  /** level 1-6 */
  onConfirm: (level: 1 | 2 | 3 | 4 | 5 | 6) => void;
}

export function HeadingDialog({ open, onClose, onConfirm }: HeadingDialogProps) {
  if (!open) return null;
  const levels: Array<{ level: 1 | 2 | 3 | 4 | 5 | 6; label: string; prefix: string }> = [
    { level: 1, label: "一级标题", prefix: "# " },
    { level: 2, label: "二级标题", prefix: "## " },
    { level: 3, label: "三级标题", prefix: "### " },
    { level: 4, label: "四级标题", prefix: "#### " },
    { level: 5, label: "五级标题", prefix: "##### " },
    { level: 6, label: "六级标题", prefix: "###### " },
  ];
  return (
    <div
      className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48"
      onMouseLeave={onClose}
    >
      <p className="text-xs text-[var(--muted)] mb-2 px-2">选择标题级别</p>
      {levels.map((h) => (
        <button
          key={h.level}
          onClick={() => {
            onConfirm(h.level);
            onClose();
          }}
          className="w-full text-left text-sm px-3 py-2 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors flex items-center justify-between"
        >
          <span>{h.label}</span>
          <span className="text-xs font-mono opacity-50">{h.prefix}</span>
        </button>
      ))}
    </div>
  );
}
