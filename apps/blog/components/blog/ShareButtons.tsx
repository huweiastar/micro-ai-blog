"use client";

import { useState } from "react";
import { Twitter, Link2, Check, MessageCircle } from "lucide-react";

export function ShareButtons() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleShareWeibo = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    window.open(
      `https://service.weibo.com/share/share.php?url=${url}&title=${title}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={handleCopyLink}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
        aria-label="Copy link"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5" />
            已复制
          </>
        ) : (
          <>
            <Link2 className="w-3.5 h-3.5" />
            复制链接
          </>
        )}
      </button>
      <button
        onClick={handleShareTwitter}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
        aria-label="分享到 X / Twitter"
      >
        <Twitter className="w-3.5 h-3.5" />
        X
      </button>
      <button
        onClick={handleShareWeibo}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors"
        aria-label="分享到微博"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        微博
      </button>
    </div>
  );
}
