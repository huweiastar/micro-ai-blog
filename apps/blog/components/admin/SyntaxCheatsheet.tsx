"use client";

import { X } from "lucide-react";

interface SyntaxCheatsheetProps {
  open: boolean;
  onClose: () => void;
}

type Row = { label: string; code: string };
type Section = { title: string; rows: Row[] };

const SECTIONS: Section[] = [
  {
    title: "标题",
    rows: [
      { label: "二级标题（进目录）", code: "## 标题" },
      { label: "三级标题（进目录）", code: "### 小标题" },
    ],
  },
  {
    title: "强调与行内",
    rows: [
      { label: "加粗", code: "**重点**" },
      { label: "斜体", code: "*强调*" },
      { label: "行内代码", code: "`code`" },
      { label: "删除线", code: "~~删掉~~" },
    ],
  },
  {
    title: "列表",
    rows: [
      { label: "无序", code: "- 项目" },
      { label: "有序", code: "1. 第一项" },
      { label: "任务", code: "- [ ] 待办\n- [x] 完成" },
    ],
  },
  {
    title: "链接与图片",
    rows: [
      { label: "链接", code: "[文字](https://...)" },
      { label: "图片", code: "![alt](/images/...)" },
    ],
  },
  {
    title: "代码块",
    rows: [{ label: "带语言高亮", code: "```ts\nconst x = 1;\n```" }],
  },
  {
    title: "引用与分割",
    rows: [
      { label: "引用", code: "> 引用内容" },
      { label: "分割线", code: "---" },
    ],
  },
  {
    title: "表格",
    rows: [{ label: "表格", code: "| 列A | 列B |\n| --- | --- |\n| 1 | 2 |" }],
  },
  {
    title: "提示框（本站特色）",
    rows: [
      { label: "笔记", code: "> [!NOTE]\n> 普通提示信息" },
      { label: "技巧", code: "> [!TIP]\n> 实用小贴士" },
      { label: "重要", code: "> [!IMPORTANT]\n> 关键内容" },
      { label: "警告", code: "> [!WARNING]\n> 需要注意" },
      { label: "危险", code: "> [!CAUTION]\n> 高风险操作" },
    ],
  },
];

export function SyntaxCheatsheet({ open, onClose }: SyntaxCheatsheetProps) {
  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-80 max-w-[85vw] bg-[var(--card)] border-l border-[var(--card-border)] shadow-2xl transition-transform duration-200 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-[var(--card-border)] shrink-0">
          <h3 className="text-sm font-semibold">Markdown 语法速查</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <div className="text-xs uppercase tracking-wider text-[var(--muted)] mb-2">
                {section.title}
              </div>
              <ul className="space-y-2">
                {section.rows.map((row) => (
                  <li key={row.label}>
                    <div className="text-xs text-[var(--muted)] mb-1">{row.label}</div>
                    <pre className="text-xs bg-[var(--background)] border border-[var(--card-border)] rounded-md px-2.5 py-1.5 overflow-x-auto whitespace-pre-wrap font-mono text-[var(--foreground)]">
                      {row.code}
                    </pre>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
