"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, X, Calendar, MapPin, Smile } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────
interface NoteItem {
  slug: string;
  date: string;
  html: string;
  tags: string[];
  mood?: string | null;
  location?: string | null;
  images: string[];
}

interface PolaroidFeedProps {
  notes: NoteItem[];
  authorName: string;
  avatar?: string;
}

// ── Group by day ──────────────────────────────────────────────────
function groupByDay(notes: NoteItem[]) {
  const groups = new Map<string, NoteItem[]>();
  for (const note of notes) {
    const day = note.date.slice(0, 10); // YYYY-MM-DD
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day)!.push(note);
  }
  // Sort days descending
  return Array.from(groups.entries()).sort(([a], [b]) => b.localeCompare(a));
}

// ── Day label ─────────────────────────────────────────────────────
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (today.getTime() - d.getTime()) / 86400000;
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  if (diff === 2) return "前天";
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// ── Deterministic pseudo-random from string ───────────────────────
function hashRotation(slug: string, index: number): number {
  let hash = 0;
  const s = slug + index;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) | 0;
  }
  // Map to [-3, 3] degrees
  return ((hash % 600) / 100) - 3;
}

// ── Main Component ────────────────────────────────────────────────
export function PolaroidFeed({ notes, authorName, avatar }: PolaroidFeedProps) {
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const dayGroups = useMemo(() => groupByDay(notes), [notes]);

  if (notes.length === 0) {
    return (
      <div className="py-20 text-center text-[var(--muted)]">
        <StickyNote className="mx-auto mb-4 h-10 w-10 opacity-50" />
        <p>还没有说说，第一条碎片想法正在路上。</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {dayGroups.map(([day, dayNotes], groupIdx) => (
        <motion.section
          key={day}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: groupIdx * 0.05 }}
        >
          {/* Day header */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-xs font-bold text-white shadow-md">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              {dayLabel(day)}
            </h2>
            <span className="text-sm text-[var(--muted)]">{dayNotes.length} 条</span>
            <div className="flex-1 border-t border-[var(--card-border)]" />
          </div>

          {/* Polaroid cards */}
          <div className="relative mx-auto flex min-h-[280px] flex-wrap items-start justify-center gap-6 px-2">
            {dayNotes.map((note, i) => (
              <PolaroidCard
                key={note.slug}
                note={note}
                index={i}
                authorName={authorName}
                avatar={avatar}
                rotation={hashRotation(note.slug, i)}
                isExpanded={expandedSlug === note.slug}
                onExpand={() => setExpandedSlug(note.slug)}
                onCollapse={() => setExpandedSlug(null)}
              />
            ))}
          </div>
        </motion.section>
      ))}

      {/* Fullscreen overlay for expanded note */}
      <AnimatePresence>
        {expandedSlug && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setExpandedSlug(null)}
          >
            {/* Expanded content handled by the card's layoutId */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Polaroid Card ─────────────────────────────────────────────────
interface PolaroidCardProps {
  note: NoteItem;
  index: number;
  authorName: string;
  avatar?: string;
  rotation: number;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
}

function PolaroidCard({
  note,
  index,
  authorName,
  avatar,
  rotation,
  isExpanded,
  onExpand,
  onCollapse,
}: PolaroidCardProps) {
  const offsetX = index % 2 === 0 ? -6 : 6;
  const delay = index * 0.05;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30, rotate: rotation, x: offsetX }}
      animate={{
        opacity: 1,
        y: 0,
        rotate: isExpanded ? 0 : rotation,
        x: isExpanded ? 0 : offsetX,
        scale: isExpanded ? 1.5 : 1,
        zIndex: isExpanded ? 50 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: isExpanded ? 0 : delay,
      }}
      whileHover={
        !isExpanded
          ? { rotate: 0, x: 0, y: -8, scale: 1.04, zIndex: 40 }
          : undefined
      }
      onClick={isExpanded ? onCollapse : onExpand}
      className="relative w-64 cursor-pointer"
      style={{ zIndex: isExpanded ? 50 : 10 - index }}
    >
      {/* Polaroid frame */}
      <div className="rounded-lg bg-white p-3 pb-14 shadow-lg ring-1 ring-black/5 dark:bg-[var(--card)] dark:ring-white/10">
        {/* Content */}
        <div
          className="prose prose-sm max-h-40 overflow-hidden text-sm text-[var(--foreground)]"
          dangerouslySetInnerHTML={{ __html: note.html }}
        />

        {/* Images grid */}
        {note.images.length > 0 && (
          <div className="mt-3 grid gap-1.5" style={{ gridTemplateColumns: note.images.length === 1 ? "1fr" : "repeat(2, 1fr)" }}>
            {note.images.slice(0, 4).map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                className="aspect-square w-full rounded object-cover"
              />
            ))}
            {note.images.length > 4 && (
              <div className="flex aspect-square items-center justify-center rounded bg-black/5 text-lg font-bold text-[var(--muted)]">
                +{note.images.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer area (bottom of polaroid) */}
      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-[var(--muted)]">
        <div className="flex items-center gap-1.5">
          {avatar && (
            <img src={avatar} alt="" className="h-4 w-4 rounded-full object-cover" />
          )}
          <span className="font-medium">{authorName}</span>
        </div>
        <div className="flex items-center gap-2">
          {note.mood && (
            <span className="flex items-center gap-0.5" title={note.mood}>
              <Smile className="h-3 w-3" />
              {note.mood}
            </span>
          )}
          {note.location && (
            <span className="flex items-center gap-0.5" title={note.location}>
              <MapPin className="h-3 w-3" />
              {note.location}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
