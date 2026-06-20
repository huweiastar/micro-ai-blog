"use client";

import { MessageCircle } from "lucide-react";

interface AssistantSuggestionsProps {
  suggestions: string[];
  onSelect: (text: string) => void;
}

export function AssistantSuggestions({ suggestions, onSelect }: AssistantSuggestionsProps) {
  return (
    <div className="mt-3 space-y-1.5">
      {suggestions.slice(0, 3).map((suggestion, i) => (
        <button
          key={i}
          onClick={() => onSelect(suggestion)}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/30 text-xs text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-colors text-left"
        >
          <MessageCircle className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{suggestion}</span>
        </button>
      ))}
    </div>
  );
}
