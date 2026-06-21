"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] bg-transparent hover:bg-[var(--card-border)]/40 transition-colors"
      aria-label={copied ? "Copied" : "Copy"}
    >
      {copied ? (
        <Check className="w-4 h-4 text-[var(--success)]" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
}
