"use client";

import { Bot, User } from "lucide-react";
import type { Message } from "../../hooks/useAssistant";
import { AssistantSources } from "./AssistantSources";
import { AssistantSuggestions } from "./AssistantSuggestions";
import { useAssistantContext } from "./AssistantContext";

interface AssistantMessageProps {
  message: Message;
}

export function AssistantMessage({ message }: AssistantMessageProps) {
  const { sendMessage } = useAssistantContext();

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl px-4 py-2.5 bg-[var(--primary)] text-white text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center">
        <Bot className="w-4 h-4 text-[var(--primary)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="rounded-xl px-4 py-3 bg-[var(--card)] border border-[var(--card-border)] text-sm leading-relaxed text-[var(--foreground)] prose-sm max-w-none">
          <MarkdownContent content={message.content} />
        </div>

        {message.sources && message.sources.length > 0 && (
          <AssistantSources sources={message.sources} />
        )}

        {message.followUps && message.followUps.length > 0 && (
          <AssistantSuggestions
            suggestions={message.followUps}
            onSelect={sendMessage}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Parse and render markdown content.
 * Handles: headings, code blocks, bold, italic, inline code, links,
 * lists, blockquotes, horizontal rules, tables, paragraphs.
 */
function MarkdownContent({ content }: { content: string }) {
  const blocks = parseBlocks(content);
  return <>{blocks}</>;
}

function parseBlocks(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks — tolerate leading whitespace so fenced blocks that the AI
    // nests inside list items (indented ```) still render correctly.
    const fenceMatch = line.match(/^(\s*)```/);
    if (fenceMatch) {
      const indent = fenceMatch[1].length;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) {
        // Strip the fence's indentation from each line, keeping deeper indents.
        codeLines.push(lines[i].slice(0, indent).trim() === "" ? lines[i].slice(indent) : lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-black/50 rounded-lg p-3 my-2 overflow-x-auto text-xs">
          <code className="text-[var(--foreground)]">{codeLines.join("\n")}</code>
        </pre>
      );
      i++; // skip closing fence
      continue;
    }

    // Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={i} className="font-semibold text-sm mt-3 mb-1">
          <InlineFormat text={line.slice(4)} />
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={i} className="font-semibold mt-3 mb-1">
          <InlineFormat text={line.slice(3)} />
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1 key={i} className="font-bold text-lg mt-3 mb-1">
          <InlineFormat text={line.slice(2)} />
        </h1>
      );
      i++;
      continue;
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}\s*$/)) {
      elements.push(<hr key={i} className="border-[var(--card-border)] my-3" />);
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("> ")) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-[var(--primary)]/30 pl-3 py-1 my-2 text-[var(--muted)] italic"
        >
          <InlineFormat text={quoteLines.join("\n")} />
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (line.match(/^[-*]\s/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^[-*]\s/)) {
        items.push(
          <li key={i} className="ml-4 list-disc">
            <InlineFormat text={lines[i].replace(/^[-*]\s/, "")} />
          </li>
        );
        i++;
      }
      elements.push(<ul key={i} className="my-1">{items}</ul>);
      continue;
    }

    // Ordered list
    if (line.match(/^\d+\.\s/)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s/)) {
        items.push(
          <li key={i} className="ml-4 list-decimal">
            <InlineFormat text={lines[i].replace(/^\d+\.\s/, "")} />
          </li>
        );
        i++;
      }
      elements.push(<ol key={i} className="my-1">{items}</ol>);
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Table row (simple detection)
    if (line.startsWith("|") && lines[i + 1]?.startsWith("|-")) {
      const tableRows: React.ReactNode[] = [];
      const headers = line.split("|").filter(Boolean).map(h => h.trim());
      i += 2; // skip header + separator
      const headerRow = (
        <tr key="header">
          {headers.map((h, idx) => (
            <th key={idx} className="px-3 py-2 border-b border-[var(--card-border)] font-semibold">
              <InlineFormat text={h} />
            </th>
          ))}
        </tr>
      );
      tableRows.push(headerRow);
      while (i < lines.length && lines[i].startsWith("|")) {
        const cells = lines[i].split("|").filter(Boolean).map(c => c.trim());
        tableRows.push(
          <tr key={i}>
            {cells.map((c, idx) => (
              <td key={idx} className="px-3 py-1.5 border-b border-[var(--card-border)]">
                <InlineFormat text={c} />
              </td>
            ))}
          </tr>
        );
        i++;
      }
      elements.push(
        <table key={i} className="border-collapse my-2 w-full text-xs">
          <tbody>{tableRows}</tbody>
        </table>
      );
      continue;
    }

    // Paragraph: merge consecutive non-block lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^\s*```/.test(lines[i]) &&
      !lines[i].startsWith("# ") &&
      !lines[i].startsWith("## ") &&
      !lines[i].startsWith("### ") &&
      !lines[i].startsWith("> ") &&
      !lines[i].match(/^[-*]\s/) &&
      !lines[i].match(/^\d+\.\s/) &&
      !lines[i].match(/^[-*_]{3,}\s*$/) &&
      !lines[i].startsWith("|")
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      elements.push(
        <p key={i} className="my-1">
          <InlineFormat text={paraLines.join("\n")} />
        </p>
      );
    }
  }

  return elements;
}

/**
 * Format inline markdown: **bold**, *italic*, `inline code`, [links](url)
 */
function InlineFormat({ text }: { text: string }): React.ReactNode {
  // Split by markdown patterns while keeping the delimiters
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];

    if (matched.startsWith("**") && matched.endsWith("**")) {
      parts.push(<strong key={match.index} className="font-semibold">{matched.slice(2, -2)}</strong>);
    } else if (matched.startsWith("`") && matched.endsWith("`")) {
      parts.push(
        <code key={match.index} className="bg-black/10 px-1.5 py-0.5 rounded text-xs font-mono">
          {matched.slice(1, -1)}
        </code>
      );
    } else if (matched.startsWith("[") && matched.includes("](")) {
      const linkMatch = matched.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] underline hover:text-[var(--primary-hover)]"
          >
            {linkMatch[1]}
          </a>
        );
      }
    } else if (matched.startsWith("*") && matched.endsWith("*")) {
      parts.push(<em key={match.index} className="italic">{matched.slice(1, -1)}</em>);
    } else {
      parts.push(matched);
    }

    lastIndex = regex.lastIndex;
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
