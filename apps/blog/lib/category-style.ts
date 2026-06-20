import {
  Database,
  Brain,
  Cpu,
  Globe,
  Wrench,
  Layers,
  Sparkles,
  Boxes,
  type LucideIcon,
} from "lucide-react";

export interface CategoryStyle {
  /** Primary accent color (hex). Use directly or with an alpha suffix, e.g. `${accent}1a`. */
  accent: string;
  /** Two-stop gradient for accent bars / icon chips. */
  gradient: [string, string];
  icon: LucideIcon;
}

// Explicit identities for the known columns — distinct hues build a focal hierarchy.
const KNOWN: Record<string, CategoryStyle> = {
  大数据开发工程: { accent: "#3b82f6", gradient: ["#3b82f6", "#06b6d4"], icon: Database },
  大模型数据工程: { accent: "#d946ef", gradient: ["#ec4899", "#a855f7"], icon: Brain },
  大模型基础架构: { accent: "#10b981", gradient: ["#10b981", "#14b8a6"], icon: Cpu },
  大模型应用工程: { accent: "#f59e0b", gradient: ["#f59e0b", "#f97316"], icon: Globe },
  AI工具: { accent: "#06b6d4", gradient: ["#0ea5e9", "#6366f1"], icon: Wrench },
};

// Deterministic fallback palette for any category not listed above.
const FALLBACK: CategoryStyle[] = [
  { accent: "#8b5cf6", gradient: ["#8b5cf6", "#6366f1"], icon: Layers },
  { accent: "#f43f5e", gradient: ["#f43f5e", "#ec4899"], icon: Sparkles },
  { accent: "#14b8a6", gradient: ["#14b8a6", "#0ea5e9"], icon: Boxes },
  { accent: "#a855f7", gradient: ["#a855f7", "#d946ef"], icon: Layers },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function getCategoryStyle(name: string): CategoryStyle {
  return KNOWN[name] ?? FALLBACK[hash(name) % FALLBACK.length];
}
