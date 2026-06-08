import { Calendar, Clock, FileText, RefreshCw, FolderOpen } from "lucide-react";
import { formatDate } from "../../lib/utils";
import { Badge } from "../ui/Badge";

interface PostMetaProps {
  date: string;
  readingTime: string;
  wordCount: number;
  updated?: string;
  category?: string;
  children?: React.ReactNode;
}

export function PostMeta({
  date,
  readingTime,
  wordCount,
  updated,
  category,
  children,
}: PostMetaProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
      <span className="inline-flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        {formatDate(date)}
      </span>
      {updated && (
        <span className="inline-flex items-center gap-1">
          <RefreshCw className="w-4 h-4" />
          更新于 {formatDate(updated)}
        </span>
      )}
      <span className="inline-flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {readingTime}
      </span>
      <span className="inline-flex items-center gap-1">
        <FileText className="w-4 h-4" />
        {wordCount} 字
      </span>
      {category && (
        <Badge tone="accent">
          <FolderOpen className="w-3 h-3" />
          {category}
        </Badge>
      )}
      {children}
    </div>
  );
}
