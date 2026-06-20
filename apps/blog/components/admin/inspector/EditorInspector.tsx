"use client";

/** 检视器内容容器：承载若干 InspectorSection。定位/响应式由 EditorChrome 负责。 */
export function EditorInspector({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}
