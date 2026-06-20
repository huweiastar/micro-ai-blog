import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getCategoryStyle } from "../../lib/category-style";
import { siteConfig } from "../../config/site";

export const runtime = "nodejs";

let fontData: Buffer | null = null;
function getFont(): Buffer {
  if (!fontData) {
    fontData = fs.readFileSync(
      path.join(process.cwd(), "assets", "fonts", "NotoSansSC-Bold.subset.woff2")
    );
  }
  return fontData;
}

function clip(s: string, max: number): string {
  const t = s.trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const title = clip(searchParams.get("title") || siteConfig.name || "微观AI", 42);
  const category = searchParams.get("category") || "";
  const kindLabel = searchParams.get("label") || category || "技术博客";
  const brand = siteConfig.name || "微观AI";
  const host = (() => {
    try {
      return new URL(siteConfig.url).host;
    } catch {
      return "";
    }
  })();

  const style = getCategoryStyle(category || brand);
  const [c1, c2] = style.gradient;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#0a0a12",
          backgroundImage: `radial-gradient(900px circle at 100% 0%, ${c1}33, transparent 55%), radial-gradient(700px circle at 0% 100%, ${c2}26, transparent 50%)`,
          fontFamily: "Noto Sans SC",
          position: "relative",
        }}
      >
        {/* accent top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "10px",
            display: "flex",
            backgroundImage: `linear-gradient(90deg, ${c1}, ${c2})`,
          }}
        />

        {/* header: brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`,
              color: "white",
              fontSize: "30px",
            }}
          >
            微
          </div>
          <div style={{ display: "flex", color: "#e6e6f0", fontSize: "30px" }}>
            {brand}
          </div>
        </div>

        {/* body: category + title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              alignItems: "center",
              padding: "10px 22px",
              borderRadius: "999px",
              fontSize: "26px",
              color: c1,
              border: `2px solid ${c1}66`,
              backgroundColor: `${c1}1a`,
            }}
          >
            {kindLabel}
          </div>
          <div
            style={{
              display: "flex",
              color: "#ffffff",
              fontSize: title.length > 22 ? "64px" : "76px",
              lineHeight: 1.25,
              letterSpacing: "-1px",
            }}
          >
            {title}
          </div>
        </div>

        {/* footer: domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "#8a8aa0",
            fontSize: "26px",
          }}
        >
          <div style={{ display: "flex" }}>{host}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "999px",
                display: "flex",
                backgroundImage: `linear-gradient(135deg, ${c1}, ${c2})`,
              }}
            />
            <div style={{ display: "flex" }}>大数据 · 大模型工程</div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Noto Sans SC",
          data: getFont(),
          weight: 700,
          style: "normal",
        },
      ],
    }
  );
}
