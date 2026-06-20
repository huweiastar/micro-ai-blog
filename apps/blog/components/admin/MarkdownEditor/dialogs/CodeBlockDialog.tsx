"use client";

interface CodeBlockDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (lang: string) => void;
}

const LANGS = [
  "javascript", "typescript", "python", "java",
  "sql", "shell", "bash", "yaml",
  "markdown", "css", "html", "go",
  "rust", "swift", "json", "dockerfile",
];

export function CodeBlockDialog({ open, onClose, onConfirm }: CodeBlockDialogProps) {
  if (!open) return null;
  return (
    <div
      className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl grid grid-cols-4 gap-1 w-72"
      onMouseLeave={onClose}
    >
      {LANGS.map((lang) => (
        <button
          key={lang}
          onClick={() => {
            onConfirm(lang);
            onClose();
          }}
          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left"
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
