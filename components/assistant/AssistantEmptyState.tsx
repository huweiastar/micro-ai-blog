"use client";

import { Bot } from "lucide-react";
import { useAssistantContext } from "./AssistantContext";

const SUGGESTED_QUESTIONS = [
  "大模型数据工程应该从哪些文章开始读？",
  "RAG 知识库问答系统的核心模块有哪些？",
  "Spark 数据倾斜有哪些优化方法？",
  "帮我找出博客中和数据清洗相关的内容。",
];

export function AssistantEmptyState() {
  const { sendMessage } = useAssistantContext();

  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/20 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8 text-[var(--primary)]" />
      </div>
      <h3 className="font-semibold text-sm mb-2">你好，我是微观AI 助手</h3>
      <p className="text-xs text-[var(--muted)] max-w-xs leading-relaxed mb-6">
        我可以帮你检索博客、项目介绍和已索引的项目代码。你可以问文章总结、学习路线、项目实现或某个代码模块的作用。
      </p>
      <div className="w-full space-y-2">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => sendMessage(q)}
            className="w-full text-left px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)]/50 text-xs text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/30 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
