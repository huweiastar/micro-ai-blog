"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type EffectStyle = "ink" | "sparkle" | "ripple" | "none";
export type ColorScheme = "purple" | "blue" | "green" | "orange" | "pink" | "cyan";

interface ThemeConfig {
  backgroundImage: string;
  backgroundOpacity: number;
  effectStyle: EffectStyle;
  colorScheme: ColorScheme;
}

const defaultTheme: ThemeConfig = {
  backgroundImage: "",
  backgroundOpacity: 50,
  effectStyle: "ink",
  colorScheme: "purple",
};

const ThemeConfigContext = createContext<{
  theme: ThemeConfig;
  setTheme: (t: Partial<ThemeConfig>) => void;
}>({ theme: defaultTheme, setTheme: () => {} });

export function useThemeConfig() {
  return useContext(ThemeConfigContext);
}

export function ThemeConfigProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultTheme);

  useEffect(() => {
    fetch("/api/theme")
      .then((r) => r.json())
      .then((data) => setThemeState({ ...defaultTheme, ...data }))
      .catch(() => {});
  }, []);

  const setTheme = (partial: Partial<ThemeConfig>) => {
    setThemeState((prev) => ({ ...prev, ...partial }));
  };

  return (
    <ThemeConfigContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeConfigContext.Provider>
  );
}
