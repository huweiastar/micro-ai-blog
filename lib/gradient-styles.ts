// Built-in gradient backgrounds for columns
export const gradientClasses: Record<string, string> = {
  "gradient-1": "from-blue-500/10 to-indigo-500/10",
  "gradient-2": "from-purple-500/10 to-pink-500/10",
  "gradient-3": "from-green-500/10 to-teal-500/10",
  "gradient-4": "from-orange-500/10 to-red-500/10",
  "gradient-5": "from-cyan-500/10 to-blue-500/10",
  "gradient-6": "from-amber-500/10 to-yellow-500/10",
  "gradient-7": "from-violet-500/10 to-purple-500/10",
  "gradient-8": "from-rose-500/10 to-pink-500/10",
  "gradient-9": "from-emerald-500/10 to-green-500/10",
  "gradient-10": "from-sky-500/10 to-indigo-500/10",
  "gradient-11": "from-fuchsia-500/10 to-rose-500/10",
  "gradient-12": "from-lime-500/10 to-emerald-500/10",
};

export function getGradientClass(background?: string): string {
  if (!background) return "";
  if (background.startsWith("gradient-")) {
    return `bg-gradient-to-br ${gradientClasses[background] || ""}`;
  }
  // Custom image background - handled inline
  return "";
}

// For custom image backgrounds, return the image path
export function getBackgroundImage(background?: string): string | undefined {
  if (!background || background.startsWith("gradient-")) return undefined;
  return background;
}
