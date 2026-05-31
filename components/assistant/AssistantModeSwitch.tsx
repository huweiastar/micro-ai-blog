"use client";

import { Globe, BookOpen, FolderOpen, Code2 } from "lucide-react";
import { useAssistantContext } from "./AssistantContext";
import type { AssistantMode } from "../../hooks/useAssistant";

const modes: { key: AssistantMode; label: string; icon: typeof Globe }[] = [
  { key: "all", label: "全站", icon: Globe },
  { key: "blog", label: "博客", icon: BookOpen },
  { key: "project", label: "项目", icon: FolderOpen },
  { key: "code", label: "代码", icon: Code2 },
];

export function AssistantModeSwitch() {
  const { mode, setMode } = useAssistantContext();

  return (
    <div className="flex gap-1 px-4 py-2 border-b border-[var(--card-border)] bg-[var(--card)]/50">
      {modes.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setMode(key)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            mode === key
              ? "bg-[var(--primary)]/15 text-[var(--primary)]"
              : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)]/10"
          }`}
        >
          <Icon className="w-3 h-3" />
          {label}
        </button>
      ))}
    </div>
  );
}
