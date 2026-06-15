import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AnimatedBackground } from "../components/ui/AnimatedBackground";
import { BackToTop } from "../components/ui/BackToTop";
import { MouseFollow } from "../components/ui/MouseFollow";
import { ClickRipple } from "../components/ui/ClickEffect";
import { AssistantLauncher } from "../components/assistant/AssistantLauncher";
import { SiteChrome } from "../components/SiteChrome";
import { CommandPaletteLazy } from "../components/CommandPalette.lazy";
import { ThemeConfigProvider } from "../components/ThemeContext";
import { CodeCopyButton } from "../components/CodeCopyButton";
import { ImageZoom } from "../components/blog/ImageZoom";
import { PageViewTracker } from "../components/PageViewTracker";
import { ProfileProvider } from "../components/ProfileProvider";
import { getSiteUrl } from "../lib/seo";
import { getAboutProfile } from "../lib/about";
import "./globals.css";

const siteUrl = getSiteUrl();
const profile = getAboutProfile();
const siteName = profile.name;

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: {
    default: `${siteName} | 个人技术博客`,
    template: `%s | ${siteName}`,
  },
  description:
    `${siteName}的个人技术博客，专注大数据开发、大模型数据工程、大模型基础架构与应用工程。`,
  keywords: [
    "大数据开发",
    "大模型数据工程",
    "大模型基础架构",
    "大模型应用工程",
    "LLM",
    "RAG",
    "Spark",
    "数据工程",
    "AI博客",
    "机器学习",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": `${siteUrl}/rss.xml`,
    },
  },
  openGraph: {
    title: `${siteName} | 个人技术博客`,
    description:
      `${siteName}的个人技术博客，专注大数据开发、大模型数据工程、大模型基础架构与应用工程。`,
    url: siteUrl,
    siteName,
    locale: "zh_CN",
    type: "website",
    images: [{ url: `${siteUrl}/og?title=${encodeURIComponent(siteName + " · 个人技术博客")}`, width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | 个人技术博客`,
    description:
      `${siteName}的个人技术博客，专注大数据开发、大模型数据工程、大模型基础架构与应用工程。`,
    images: [`${siteUrl}/og?title=${encodeURIComponent(siteName + " · 个人技术博客")}`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 同步执行（不加 async/defer），保证首帧前完成暗色判定，避免闪白 */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script src="/theme-init.js" />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" storageKey="theme">
          <ProfileProvider>
            <ThemeConfigProvider>
              <PageViewTracker />
              <MouseFollow />
              <ClickRipple />
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-[var(--primary)] focus:px-4 focus:py-2 focus:text-white"
              >
                跳到主内容
              </a>
              <SiteChrome
                background={<AnimatedBackground />}
                header={<Header />}
                footer={<Footer />}
                backToTop={<BackToTop />}
                launcher={<AssistantLauncher />}
                commandPalette={<CommandPaletteLazy />}
              >
                {children}
              </SiteChrome>
              <CodeCopyButton />
              <ImageZoom />
            </ThemeConfigProvider>
          </ProfileProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
