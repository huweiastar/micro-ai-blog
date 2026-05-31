# Auto Theme Switch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically switch between light/dark theme based on time of day (6:00-18:00 = light).

**Architecture:** A React hook checks the current time every 60 seconds and calls `setTheme` from `next-themes` when the target theme differs from the current one. A thin component invokes the hook and is mounted in `RootLayout`.

**Tech Stack:** React hooks, next-themes, TypeScript

---

### Task 1: Create `hooks/useAutoTheme.ts`

**Files:**
- Create: `hooks/useAutoTheme.ts`

- [ ] **Step 1: Write the hook**

```typescript
import { useTheme } from "next-themes";
import { useEffect } from "react";

const DAY_HOUR = 6;
const NIGHT_HOUR = 18;
const CHECK_INTERVAL = 60_000; // 1 minute

function getTargetTheme(): "light" | "dark" {
  const hour = new Date().getHours();
  return hour >= DAY_HOUR && hour < NIGHT_HOUR ? "light" : "dark";
}

export function useAutoTheme() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const target = getTargetTheme();
    if (theme !== target) {
      setTheme(target);
    }

    const interval = setInterval(() => {
      const next = getTargetTheme();
      if (theme !== next) {
        setTheme(next);
      }
    }, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [theme, setTheme]);
}
```

### Task 2: Create `components/AutoThemeSwitcher.tsx`

**Files:**
- Create: `components/AutoThemeSwitcher.tsx`

- [ ] **Step 1: Write the thin component**

```typescript
"use client";

import { useAutoTheme } from "@/hooks/useAutoTheme";

export function AutoThemeSwitcher() {
  useAutoTheme();
  return null;
}
```

### Task 3: Mount in `app/layout.tsx`

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add import and mount `<AutoThemeSwitcher />` inside `ThemeProvider`**

Add import at top (next to existing imports):
```typescript
import { AutoThemeSwitcher } from "@/components/AutoThemeSwitcher";
```

Add `<AutoThemeSwitcher />` as the first child of `ThemeProvider`, right after its opening tag:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" storageKey="theme">
  <AutoThemeSwitcher />
  <ThemeConfigProvider>
    ...
  </ThemeConfigProvider>
</ThemeProvider>
```

### Task 4: Verify build

**Files:** none

- [ ] **Step 1: Run build to confirm no TypeScript errors**

Run: `npx next build`
Expected: Build succeeds without type errors related to the new files.

---

## Self-Review

1. **Spec coverage:** ✅ `useAutoTheme` hook — Task 1. ✅ `AutoThemeSwitcher` component — Task 2. ✅ Mount in `RootLayout` — Task 3. ✅ Build verify — Task 4. All spec items covered.

2. **Placeholder scan:** None found. All code shown inline, all paths explicit.

3. **Type consistency:** `useTheme()` from `next-themes` returns `{ theme: string, setTheme: (t: string) => void }` — matches usage in `useAutoTheme`. Constants defined once, used consistently.
