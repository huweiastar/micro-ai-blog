"use client";

import { useEffect, useRef, useState } from "react";

const HOVER_LINES = [
  "在写代码吗？记得喝水 💧",
  "今天也要加油哦！",
  "摸鱼一下也没关系～",
  "你已经很棒了！",
  "需要帮忙就点右边的 AI 助手 🤖",
];
const CLICK_LINES = [
  "嘿！戳我干嘛～",
  "Bug 是成长的好朋友 🐛",
  "Ctrl + S 保存一下灵感吧！",
  "去看看「最新动态」呀 📌",
  "祝你今天 0 报错 ✨",
  "喵呜～（其实我是只电子宠物）",
];

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

/**
 * 桌面宠物：左下角的小挂件。悬浮/点击会冒出气泡台词，点击还会蹦一下。
 * 始终显示（不可关闭），reduced-motion 下动画自动降级。
 */
export function DesktopPet() {
  const [message, setMessage] = useState<string | null>(null);
  const [jumping, setJumping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showMessage = (text: string, ms = 3200) => {
    setMessage(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), ms);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const onClick = () => {
    setJumping(true);
    setTimeout(() => setJumping(false), 500);
    showMessage(pick(CLICK_LINES));
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 hidden select-none sm:block">
      {/* 气泡台词 */}
      {message && (
        <div className="absolute bottom-full left-1/2 mb-2 w-max max-w-[220px] -translate-x-1/3 animate-fade-in-up rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-3 py-2 text-xs leading-relaxed text-[var(--foreground)] shadow-lg">
          {message}
          <span className="absolute -bottom-1 left-6 h-2 w-2 rotate-45 border-b border-r border-[var(--card-border)] bg-[var(--card)]" />
        </div>
      )}

      <div className="relative">
        {/* 宠物本体 */}
        <button
          onClick={onClick}
          onMouseEnter={() => showMessage(pick(HOVER_LINES))}
          aria-label="桌面宠物"
          className={`block cursor-pointer drop-shadow-lg ${jumping ? "pet-jump" : "pet-bob"}`}
        >
          <svg width="60" height="64" viewBox="0 0 60 64" fill="none" aria-hidden>
            {/* 天线 */}
            <line x1="30" y1="6" x2="30" y2="16" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="30" cy="5" r="3.5" fill="var(--accent)" />
            {/* 身体 */}
            <rect x="8" y="16" width="44" height="40" rx="16" fill="var(--primary)" />
            <rect x="8" y="16" width="44" height="40" rx="16" fill="url(#petglow)" opacity="0.25" />
            {/* 脸盘（随主题：亮色深墨蓝 / 暗色亮 slate，避免与背景同色） */}
            <rect x="15" y="24" width="30" height="22" rx="11" fill="var(--pet-face)" />
            {/* 眼睛 */}
            <circle className="pet-eye" cx="25" cy="35" r="3.4" fill="var(--pet-eye)" />
            <circle className="pet-eye" cx="37" cy="35" r="3.4" fill="var(--pet-eye)" />
            {/* 腮红 */}
            <circle cx="18" cy="41" r="2.2" fill="var(--accent)" opacity="0.6" />
            <circle cx="44" cy="41" r="2.2" fill="var(--accent)" opacity="0.6" />
            {/* 脚 */}
            <rect x="18" y="54" width="8" height="6" rx="3" fill="var(--primary)" />
            <rect x="34" y="54" width="8" height="6" rx="3" fill="var(--primary)" />
            <defs>
              <linearGradient id="petglow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </button>
      </div>
    </div>
  );
}
