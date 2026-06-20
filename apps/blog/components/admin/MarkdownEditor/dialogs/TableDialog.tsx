"use client";

import { useState } from "react";

interface TableDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (rows: number, cols: number) => void;
}

export function TableDialog({ open, onClose, onConfirm }: TableDialogProps) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  if (!open) return null;
  return (
    <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-56">
      <p className="text-sm text-[var(--foreground)] mb-3">插入表格</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-[var(--muted)]">行数</label>
          <input
            type="number"
            min={2}
            max={10}
            value={rows}
            onChange={(e) => setRows(Number(e.target.value))}
            className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="text-xs text-[var(--muted)]">列数</label>
          <input
            type="number"
            min={2}
            max={6}
            value={cols}
            onChange={(e) => setCols(Number(e.target.value))}
            className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            const safeRows = Number.isFinite(rows) && rows >= 2 ? rows : 2;
            const safeCols = Number.isFinite(cols) && cols >= 2 ? cols : 2;
            onConfirm(safeRows, safeCols);
            onClose();
          }}
          className="flex-1 text-xs px-3 py-1.5 rounded bg-[var(--primary)] text-white"
        >
          插入
        </button>
        <button
          onClick={onClose}
          className="flex-1 text-xs px-3 py-1.5 rounded border border-[var(--card-border)] text-[var(--muted)]"
        >
          取消
        </button>
      </div>
    </div>
  );
}
