"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface GraphArticle {
  slug: string;
  title: string;
  category: string;
  tags: string[];
}

interface GNode {
  id: string;
  type: "article" | "tag";
  label: string;
  slug?: string;
  deg: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}
interface GLink {
  s: string;
  t: string;
}

const W = 900;
const H = 640;

/**
 * 知识图谱：文章 ↔ 标签的二部关系网。客户端跑一个轻量力导向布局（固定迭代，
 * 无动画、reduced-motion 友好），SVG 渲染；悬浮高亮邻居，点击文章节点跳转。
 */
export function KnowledgeGraph({ articles }: { articles: GraphArticle[] }) {
  const router = useRouter();
  const [hover, setHover] = useState<string | null>(null);
  const [nodes, setNodes] = useState<GNode[]>([]);
  const linksRef = useRef<GLink[]>([]);
  const adjRef = useRef<Map<string, Set<string>>>(new Map());

  // 构建节点/边
  const built = useMemo(() => {
    const nodeMap = new Map<string, GNode>();
    const links: GLink[] = [];
    const addNode = (n: Omit<GNode, "x" | "y" | "vx" | "vy">) => {
      if (!nodeMap.has(n.id))
        nodeMap.set(n.id, { ...n, x: 0, y: 0, vx: 0, vy: 0 });
      else nodeMap.get(n.id)!.deg += n.deg;
    };
    for (const a of articles) {
      addNode({ id: `a:${a.slug}`, type: "article", label: a.title, slug: a.slug, deg: a.tags.length });
      for (const tag of a.tags) {
        addNode({ id: `t:${tag}`, type: "tag", label: tag, deg: 1 });
        links.push({ s: `a:${a.slug}`, t: `t:${tag}` });
      }
    }
    return { nodes: [...nodeMap.values()], links };
  }, [articles]);

  useEffect(() => {
    const ns = built.nodes.map((n, i) => {
      // 初始放在圆上（确定性，避免每次抖动）
      const ang = (i / Math.max(1, built.nodes.length)) * Math.PI * 2;
      return { ...n, x: W / 2 + Math.cos(ang) * 220, y: H / 2 + Math.sin(ang) * 200 };
    });
    const idx = new Map(ns.map((n, i) => [n.id, i]));
    const adj = new Map<string, Set<string>>();
    for (const l of built.links) {
      if (!adj.has(l.s)) adj.set(l.s, new Set());
      if (!adj.has(l.t)) adj.set(l.t, new Set());
      adj.get(l.s)!.add(l.t);
      adj.get(l.t)!.add(l.s);
    }
    // 力导向：库仑斥力 + 边弹簧 + 向心力
    const k = 130;
    for (let iter = 0; iter < 320; iter++) {
      const cool = 1 - iter / 320;
      for (let i = 0; i < ns.length; i++) {
        let fx = 0, fy = 0;
        for (let j = 0; j < ns.length; j++) {
          if (i === j) continue;
          let dx = ns[i].x - ns[j].x;
          let dy = ns[i].y - ns[j].y;
          let d2 = dx * dx + dy * dy || 0.01;
          const rep = (k * k) / d2;
          const d = Math.sqrt(d2);
          fx += (dx / d) * rep;
          fy += (dy / d) * rep;
        }
        // 向心
        fx += (W / 2 - ns[i].x) * 0.015;
        fy += (H / 2 - ns[i].y) * 0.015;
        ns[i].vx = (ns[i].vx + fx) * 0.5;
        ns[i].vy = (ns[i].vy + fy) * 0.5;
      }
      for (const l of built.links) {
        const a = ns[idx.get(l.s)!];
        const b = ns[idx.get(l.t)!];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const spring = (d - k) * 0.05;
        const ux = (dx / d) * spring;
        const uy = (dy / d) * spring;
        a.vx += ux; a.vy += uy; b.vx -= ux; b.vy -= uy;
      }
      for (const n of ns) {
        n.x += Math.max(-12, Math.min(12, n.vx)) * cool;
        n.y += Math.max(-12, Math.min(12, n.vy)) * cool;
        n.x = Math.max(40, Math.min(W - 40, n.x));
        n.y = Math.max(30, Math.min(H - 30, n.y));
      }
    }
    linksRef.current = built.links;
    adjRef.current = adj;
    setNodes(ns);
  }, [built]);

  const posById = useMemo(() => {
    const m = new Map<string, GNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const isDim = (id: string) => {
    if (!hover) return false;
    if (id === hover) return false;
    return !adjRef.current.get(hover)?.has(id);
  };

  if (nodes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--muted)]">
        正在编织知识网络…
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full select-none"
      role="img"
      aria-label="文章与标签的知识关系图谱"
    >
      {/* 边 */}
      {linksRef.current.map((l, i) => {
        const a = posById.get(l.s);
        const b = posById.get(l.t);
        if (!a || !b) return null;
        const active = hover && (l.s === hover || l.t === hover);
        const dim = hover && !active;
        return (
          <line
            key={i}
            x1={a.x} y1={a.y} x2={b.x} y2={b.y}
            stroke="var(--primary)"
            strokeWidth={active ? 1.6 : 0.8}
            opacity={dim ? 0.05 : active ? 0.6 : 0.18}
          />
        );
      })}
      {/* 节点 */}
      {nodes.map((n) => {
        const dim = isDim(n.id);
        const isArticle = n.type === "article";
        const r = isArticle ? 7 + Math.min(6, n.deg) : 4 + Math.min(7, n.deg);
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            opacity={dim ? 0.25 : 1}
            style={{ cursor: isArticle ? "pointer" : "default", transition: "opacity .2s" }}
            onMouseEnter={() => setHover(n.id)}
            onMouseLeave={() => setHover(null)}
            onClick={() => isArticle && n.slug && router.push(`/blog/${n.slug}`)}
          >
            <circle
              r={r}
              fill={isArticle ? "var(--primary)" : "var(--card)"}
              stroke={isArticle ? "var(--background)" : "var(--accent)"}
              strokeWidth={isArticle ? 2 : 1.5}
            />
            <text
              x={r + 4}
              y={4}
              fontSize={isArticle ? 12 : 10}
              className="font-medium"
              fill={isArticle ? "var(--foreground)" : "var(--muted)"}
              style={{ pointerEvents: "none" }}
            >
              {n.label.length > 16 ? n.label.slice(0, 16) + "…" : n.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
