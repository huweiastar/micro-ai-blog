"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          fontFamily: "sans-serif",
        }}
      >
        <h1>站点出现严重错误</h1>
        <button onClick={reset}>重新加载</button>
      </body>
    </html>
  );
}
