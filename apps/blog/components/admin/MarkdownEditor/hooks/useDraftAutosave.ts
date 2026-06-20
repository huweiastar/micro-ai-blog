"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface DraftEnvelope {
  html: string;
  updatedAt: number;
}

const TTL_MS = 7 * 24 * 60 * 60 * 1000;        // 7 days
const FRESH_GUARD_MS = 30 * 1000;              // don't show banner if draft within 30s of mount
const DEBOUNCE_MS = 1500;

export function useDraftAutosave(
  draftKey: string | undefined,
  value: string,
): {
  detectedDraft: DraftEnvelope | null;
  restore: () => string | null;
  discard: () => void;
  clear: () => void;
} {
  const [detectedDraft, setDetectedDraft] = useState<DraftEnvelope | null>(null);
  const openTimeRef = useRef<number>(typeof window === "undefined" ? 0 : Date.now());
  /** The last value we wrote to localStorage. */
  const lastSavedRef = useRef<string>(value);
  /** The previous `value` prop — used to detect whether a change came from
   *  user input (prevValue === lastSaved) or from an API load (prevValue !== lastSaved). */
  const prevValueRef = useRef<string>(value);

  // On mount: load + decide whether to surface banner
  useEffect(() => {
    if (!draftKey || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(draftKey);
      if (!raw) return;
      const env = JSON.parse(raw) as DraftEnvelope;
      if (!env || typeof env.html !== "string") return;
      if (Date.now() - env.updatedAt > TTL_MS) {
        window.localStorage.removeItem(draftKey);
        return;
      }
      // Suppress banner if local draft is essentially the value we already have, or just-written
      if (env.html === value) return;
      if (env.updatedAt > openTimeRef.current - FRESH_GUARD_MS) return;
      setDetectedDraft(env);
    } catch {
      /* malformed; ignore */
    }
    // intentionally no deps beyond draftKey: only run on mount per editor instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey]);

  // Debounced write — only fires when the value change came from USER INPUT.
  // We distinguish user input from API loads by checking whether prevValue === lastSaved.
  useEffect(() => {
    if (!draftKey || typeof window === "undefined") return;

    const isUserChange = prevValueRef.current === lastSavedRef.current;
    prevValueRef.current = value;

    if (isUserChange && value !== lastSavedRef.current) {
      const handle = window.setTimeout(() => {
        try {
          const env: DraftEnvelope = { html: value, updatedAt: Date.now() };
          window.localStorage.setItem(draftKey, JSON.stringify(env));
          lastSavedRef.current = value;
        } catch {
          /* quota exceeded — silently ignore */
        }
      }, DEBOUNCE_MS);
      return () => window.clearTimeout(handle);
    }

    // Not a user change (API loaded content) — just sync the refs.
    lastSavedRef.current = value;
    return () => {};
  }, [draftKey, value]);

  const restore = useCallback((): string | null => {
    if (!detectedDraft) return null;
    const html = detectedDraft.html;
    setDetectedDraft(null);
    return html;
  }, [detectedDraft]);

  const discard = useCallback(() => {
    if (draftKey && typeof window !== "undefined") {
      window.localStorage.removeItem(draftKey);
    }
    setDetectedDraft(null);
  }, [draftKey]);

  const clear = useCallback(() => {
    if (draftKey && typeof window !== "undefined") {
      window.localStorage.removeItem(draftKey);
    }
  }, [draftKey]);

  return { detectedDraft, restore, discard, clear };
}
