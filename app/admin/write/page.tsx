"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Loader2, Check, X,
  Bold, Italic, Link2, Code, Heading, Image as ImageIcon, List, ListOrdered,
  Quote, Eye, Pencil, Strikethrough, Table2, Minus, Type,
  ArrowLeft, Import, FileText as FileIcon,
  Underline, Superscript, Subscript, Highlighter, Footprints,
  Undo2, Redo2, Maximize2, Minimize2, Search,
  Palette, AlignVerticalJustifyCenter, Columns2,
  Minus as MinusIcon, Code2, TextCursorInput, Sparkles,
} from "lucide-react";
import { AiWriteModal } from "../../../components/admin/ai-write-modal";

type CategoryConfig = {
  name: string;
  description: string;
};

export default function WritePage() {
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [articleTitle, setArticleTitle] = useState("");
  const [articleSummary, setArticleSummary] = useState("");
  const [articleCategory, setArticleCategory] = useState("");
  const [articleTags, setArticleTags] = useState("");
  const [articleContent, setArticleContent] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<{ success: boolean; message: string; fileName?: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [showCodeBlockLang, setShowCodeBlockLang] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [showHeadingDialog, setShowHeadingDialog] = useState(false);
  const [showFontFamilyDialog, setShowFontFamilyDialog] = useState(false);
  const [showFontSizeDialog, setShowFontSizeDialog] = useState(false);
  const [showFontColorDialog, setShowFontColorDialog] = useState(false);
  const [showLineHeightDialog, setShowLineHeightDialog] = useState(false);
  const [showParagraphSpacingDialog, setShowParagraphSpacingDialog] = useState(false);
  const [selectedFontColor, setSelectedFontColor] = useState("#6366f1");
  const [customFontSize, setCustomFontSize] = useState(16);
  const [customLineHeight, setCustomLineHeight] = useState(1.8);
  const [customParagraphSpacing, setCustomParagraphSpacing] = useState(8);
  const [globalStyleMode, setGlobalStyleMode] = useState<'selection' | 'global'>('selection');
  const [customImageWidth, setCustomImageWidth] = useState(400);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [pendingImageUrl, setPendingImageUrl] = useState("");
  const [pendingImageAlt, setPendingImageAlt] = useState("");
  const [imageSize, setImageSize] = useState("full");
  const [imageLayout, setImageLayout] = useState<"single" | "double">("single");
  const [doubleImageQueue, setDoubleImageQueue] = useState<string[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    if (!editorRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else {
      try {
        await editorRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch {}
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Feishu import state
  const [showFeishuImport, setShowFeishuImport] = useState(false);
  const [feishuUrl, setFeishuUrl] = useState("");
  const [feishuLoading, setFeishuLoading] = useState(false);
  const [feishuError, setFeishuError] = useState("");

  // AI write state
  const [showAiWrite, setShowAiWrite] = useState(false);

  // Dialog states
  const [showMoreDialog, setShowMoreDialog] = useState(false);
  const [showMetaPanel, setShowMetaPanel] = useState(true);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Load categories
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        setCategories(data);
        if (data.length > 0 && !articleCategory) setArticleCategory(data[0].name);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-load draft
  useEffect(() => {
    try {
      const draft = localStorage.getItem("blog-draft");
      if (draft) {
        const { title, summary, tags, category, content } = JSON.parse(draft);
        if (title || content) {
          setArticleTitle(title || "");
          setArticleSummary(summary || "");
          setArticleTags(tags || "");
          if (category) setArticleCategory(category);
          setArticleContent(content || "");
        }
      }
    } catch {}
  }, []);

  // Auto-save draft every 10s
  useEffect(() => {
    const timer = setInterval(() => {
      if (articleTitle || articleContent) {
        localStorage.setItem("blog-draft", JSON.stringify({
          title: articleTitle, summary: articleSummary, tags: articleTags, category: articleCategory, content: articleContent,
        }));
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [articleTitle, articleSummary, articleTags, articleCategory, articleContent]);

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = articleContent.substring(start, end);

    // Check if already wrapped (toggle off)
    const textBefore = articleContent.substring(Math.max(0, start - before.length), start);
    const textAfter = articleContent.substring(end, Math.min(articleContent.length, end + after.length));
    if (textBefore === before && textAfter === after) {
      // Remove wrapper
      const newText = articleContent.substring(0, start - before.length) + selected + articleContent.substring(end + after.length);
      setArticleContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start - before.length, start - before.length + selected.length); }, 0);
      return;
    }

    // Add wrapper
    const newText = articleContent.substring(0, start) + before + selected + after + articleContent.substring(end);
    setArticleContent(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + before.length, start + before.length + selected.length); }, 0);
  };

  const insertList = (prefix: string) => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Determine the range of lines affected
    const contentStart = articleContent.lastIndexOf("\n", start - 1) + 1;
    const contentEndRaw = articleContent.indexOf("\n", end);
    const contentEnd = contentEndRaw === -1 ? articleContent.length : contentEndRaw;
    const linesText = articleContent.substring(contentStart, contentEnd);
    const lines = linesText.split("\n");

    // Check if ALL non-empty lines already have the prefix (toggle off)
    const allPrefixed = lines.every((line) => {
      if (!line.trim()) return true; // empty lines are ok
      if (prefix === "1. ") {
        return /^\d+\. /.test(line);
      }
      return line.startsWith(prefix);
    });

    if (allPrefixed) {
      // Remove prefix from all lines
      const processed = lines.map((line) => {
        if (!line.trim()) return line;
        if (prefix === "1. ") {
          return line.replace(/^\d+\. /, "");
        }
        return line.startsWith(prefix) ? line.slice(prefix.length) : line;
      }).join("\n");

      const newText = articleContent.substring(0, contentStart) + processed + articleContent.substring(contentEnd);
      setArticleContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    } else {
      // Add prefix to all non-empty lines
      let counter = 1;
      const processed = lines.map((line) => {
        if (!line.trim()) return line;
        if (prefix === "1. ") {
          // If some lines already have numbered prefix, strip them first
          const clean = line.replace(/^\d+\. /, "");
          const num = counter++;
          return `${num}. ${clean}`;
        }
        return `${prefix}${line}`;
      }).join("\n");

      const newText = articleContent.substring(0, contentStart) + processed + articleContent.substring(contentEnd);
      setArticleContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    }
  };

  const insertQuote = () => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    // Determine the range of lines affected
    const contentStart = articleContent.lastIndexOf("\n", start - 1) + 1;
    const contentEndRaw = articleContent.indexOf("\n", end);
    const contentEnd = contentEndRaw === -1 ? articleContent.length : contentEndRaw;
    const linesText = articleContent.substring(contentStart, contentEnd);
    const lines = linesText.split("\n");

    // Check if ALL non-empty lines already have > prefix (toggle off)
    const allQuoted = lines.every((line) => {
      if (!line.trim()) return true;
      return line.startsWith("> ");
    });

    if (allQuoted) {
      // Remove > prefix from all lines
      const processed = lines.map((line) => {
        if (!line.trim()) return line;
        return line.startsWith("> ") ? line.slice(2) : line;
      }).join("\n");

      const newText = articleContent.substring(0, contentStart) + processed + articleContent.substring(contentEnd);
      setArticleContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    } else {
      // Add > prefix to all non-empty lines
      const processed = lines.map((line) => {
        if (!line.trim()) return line;
        return `> ${line}`;
      }).join("\n");

      const newText = articleContent.substring(0, contentStart) + processed + articleContent.substring(contentEnd);
      setArticleContent(newText);
      setTimeout(() => { textarea.focus(); textarea.setSelectionRange(contentStart, contentStart + processed.length); }, 0);
    }
  };

  const uploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "blog");
    // Pass category and article title for structured folder
    formData.append("category", articleCategory || "未分类");
    formData.append("articleTitle", articleTitle || "草稿");
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (data.success) {
      setUploadedImageUrl(data.url);
      // Open image settings dialog
      setPendingImageUrl(data.url);
      setPendingImageAlt("");
      setImageSize("full");
      setImageLayout("single");
      setShowImageDialog(true);
    }
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  };

  const getImageSizeStyle = () => {
    switch (imageSize) {
      case "small": return `style="max-width: 33%; margin: 0 auto;"`;
      case "medium": return `style="max-width: 66%; margin: 0 auto;"`;
      case "custom": return `style="max-width: ${customImageWidth}px; margin: 0 auto;"`;
      default: return `class="max-w-full"`;
    }
  };

  const insertImageWithSettings = () => {
    const sizeAttr = getImageSizeStyle();
    const alt = pendingImageAlt || "图片";
    const caption = pendingImageAlt || "在此输入图片描述...";

    let content = "";
    if (imageLayout === "double") {
      setDoubleImageQueue(prev => [...prev, pendingImageUrl]);
      if (doubleImageQueue.length === 0) {
        // This is the first image, wait for second
        setPendingImageUrl("");
        setPendingImageAlt("");
        setShowImageDialog(false);
        return;
      }
      // We have two images, insert them as a pair
      const img1 = `<figure class="image-block flex-1"><img src="${doubleImageQueue[0]}" alt="图片1" ${sizeAttr} /><figcaption class="image-caption">在此输入图片描述...</figcaption></figure>`;
      const img2 = `<figure class="image-block flex-1"><img src="${pendingImageUrl}" alt="${alt}" ${sizeAttr} /><figcaption class="image-caption">${caption}</figcaption></figure>`;
      content = `\n<div class="flex gap-4">\n${img1}\n${img2}\n</div>\n`;
      setDoubleImageQueue([]);
    } else {
      content = `\n<figure class="image-block">\n  <img src="${pendingImageUrl}" alt="${alt}" ${sizeAttr} />\n  <figcaption class="image-caption">${caption}</figcaption>\n</figure>\n`;
    }

    insertMarkdown(content);
    setShowImageDialog(false);
    setPendingImageUrl("");
    setPendingImageAlt("");
  };

  const cancelImageInsert = () => {
    setShowImageDialog(false);
    setPendingImageUrl("");
    setPendingImageAlt("");
    setDoubleImageQueue([]);
  };

  const insertCodeBlock = (lang: string) => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const selected = articleContent.substring(start, textarea.selectionEnd);
    const newText = articleContent.substring(0, start) + "```" + lang + "\n" + (selected || "// code") + "\n```" + articleContent.substring(textarea.selectionEnd);
    setArticleContent(newText);
    setShowCodeBlockLang(false);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start + lang.length + 4, start + lang.length + 4 + (selected || "// code").length); }, 0);
  };

  const insertFootnote = () => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;

    // Find the next available footnote number
    const footnotes = articleContent.match(/\[\^(\d+)\]/g) || [];
    const numbers = footnotes.map((m) => parseInt(m.replace(/[\[\^:]/g, "")));
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;

    const ref = `[^${nextNum}]`;
    const def = `[^${nextNum}]: 脚注内容`;

    const newText =
      articleContent.substring(0, start) +
      ref +
      articleContent.substring(start) +
      "\n\n" +
      def;

    setArticleContent(newText);
    setTimeout(() => {
      textarea.focus();
      const defPos = newText.indexOf(def);
      if (defPos !== -1) {
        // Select the placeholder text "脚注内容"
        const contentStart = defPos + ref.length + 2; // after "[^N]: "
        textarea.setSelectionRange(contentStart, contentStart + 4);
      }
    }, 0);
  };

  const insertTable = () => {
    let table = "\n";
    const headerCells = Array.from({ length: tableCols }, () => "列名").join(" | ");
    table += `| ${headerCells} |\n`;
    const sepCells = Array.from({ length: tableCols }, () => "---").join(" | ");
    table += `| ${sepCells} |\n`;
    for (let r = 0; r < tableRows - 1; r++) {
      const dataCells = Array.from({ length: tableCols }, () => "内容").join(" | ");
      table += `| ${dataCells} |\n`;
    }
    insertMarkdown(table);
    setShowTableDialog(false);
  };

  // Font formatting functions — wrap selected text with inline HTML
  const insertFontStyle = (tag: string) => {
    const textarea = document.querySelector("#article-content") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = articleContent.substring(start, end);
    if (!selected.trim()) return;

    const newText = articleContent.substring(0, start) + tag + selected + "</span>" + articleContent.substring(end);
    setArticleContent(newText);
    setTimeout(() => { textarea.focus(); textarea.setSelectionRange(start, start + tag.length + selected.length); }, 0);
  };

  const setFontFamily = (family: string) => {
    insertFontStyle(`<span style="font-family: '${family}'">`);
    setShowFontFamilyDialog(false);
  };

  const setFontSize = (size: number) => {
    insertFontStyle(`<span style="font-size: ${size}px">`);
    setShowFontSizeDialog(false);
  };

  const setCustomFontSizeValue = () => {
    insertFontStyle(`<span style="font-size: ${customFontSize}px">`);
    setShowFontSizeDialog(false);
  };

  const setFontColor = (color: string) => {
    insertFontStyle(`<span style="color: ${color}">`);
    setSelectedFontColor(color);
    setShowFontColorDialog(false);
  };

  const setCustomFontColor = () => {
    insertFontStyle(`<span style="color: ${selectedFontColor}">`);
    setShowFontColorDialog(false);
  };

  const setLineHeight = (value: number) => {
    insertFontStyle(`<span style="line-height: ${value}">`);
    setShowLineHeightDialog(false);
  };

  const setCustomLineHeightValue = () => {
    insertFontStyle(`<span style="line-height: ${customLineHeight}">`);
    setShowLineHeightDialog(false);
  };

  const setParagraphSpacing = (value: number) => {
    insertFontStyle(`<span style="margin-bottom: ${value}px">`);
    setShowParagraphSpacingDialog(false);
  };

  const setCustomParagraphSpacingValue = () => {
    insertFontStyle(`<span style="margin-bottom: ${customParagraphSpacing}px">`);
    setShowParagraphSpacingDialog(false);
  };

  // Global style: inject a <style> block at the top of the article
  const setGlobalStyle = (property: string, value: string | number) => {
    const styleTag = `<style>
.editor-preview * { ${property}: ${value} !important; }
</style>`;
    const markerStart = '<!--editor-global-style-->';
    const markerEnd = '<!--/editor-global-style-->';
    const existingBlock = articleContent.match(new RegExp(`${markerStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
    if (existingBlock) {
      setArticleContent(articleContent.replace(existingBlock[0], `${markerStart}\n${styleTag}\n${markerEnd}`));
    } else {
      setArticleContent(`${markerStart}\n${styleTag}\n${markerEnd}\n\n${articleContent}`);
    }
  };

  // Apply style: either global or selection-based
  const applyStyle = (fn: () => void, globalFn: () => void) => {
    if (globalStyleMode === 'global') {
      globalFn();
    } else {
      fn();
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("blog-draft");
    setArticleTitle(""); setArticleSummary(""); setArticleTags(""); setArticleContent("");
  };

  const getWordCount = () => {
    const text = articleContent.replace(/[#*`~\-\[\]!()]/g, "").trim();
    const cn = (text.match(/[一-鿿]/g) || []).length;
    const en = (text.replace(/[一-鿿]/g, "").match(/\b\w+\b/g) || []).length;
    return { cn, en, total: cn + en };
  };

  const publishArticle = async () => {
    if (!articleTitle.trim()) { alert("请输入文章标题"); return; }
    if (!articleContent.trim()) { alert("请输入文章内容"); return; }
    setPublishing(true); setPublishResult(null);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: articleTitle, date: new Date().toISOString().split("T")[0], summary: articleSummary || articleTitle, tags: articleTags, category: articleCategory, content: articleContent }),
      });
      const data = await res.json();
      setPublishResult({ ...data, fileName: data.fileName });
      if (data.success) { setArticleTitle(""); setArticleSummary(""); setArticleTags(""); setArticleContent(""); localStorage.removeItem("blog-draft"); }
    } catch { setPublishResult({ success: false, message: "发布失败" }); }
    finally { setPublishing(false); }
  };

  const importFromFeishu = async () => {
    if (!feishuUrl.trim()) { setFeishuError("请输入飞书文档链接"); return; }
    setFeishuLoading(true); setFeishuError("");
    try {
      const res = await fetch("/api/feishu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: feishuUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setArticleTitle(data.title || "");
        setArticleContent(data.content || "");
        setShowFeishuImport(false);
        setFeishuUrl("");
      } else {
        setFeishuError(data.message || "导入失败");
      }
    } catch {
      setFeishuError("网络错误，请重试");
    } finally {
      setFeishuLoading(false);
    }
  };

  const handleAiInsert = (result: { title: string; summary: string; tags: string; category: string; content: string }) => {
    if (result.title) setArticleTitle(result.title);
    if (result.summary) setArticleSummary(result.summary);
    if (result.tags) setArticleTags(result.tags);
    if (result.content) setArticleContent(result.content);

    // Match AI-suggested category to configured categories
    if (result.category) {
      const match = categories.find((c) => c.name === result.category);
      if (match) {
        setArticleCategory(match.name);
      } else {
        // Fuzzy match: check if any category name is a substring
        const fuzzyMatch = categories.find((c) =>
          result.category.includes(c.name) || c.name.includes(result.category!)
        );
        if (fuzzyMatch) {
          setArticleCategory(fuzzyMatch.name);
        }
        // Otherwise keep current category
      }
    }

    // Trigger immediate draft save
    localStorage.setItem("blog-draft", JSON.stringify({
      title: result.title || articleTitle,
      summary: result.summary || articleSummary,
      tags: result.tags || articleTags,
      category: articleCategory,
      content: result.content || articleContent,
    }));
  };

  const mdToolbar = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), title: "加粗 Ctrl+B" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), title: "斜体 Ctrl+I" },
    { icon: Underline, action: () => insertMarkdown("<u>", "</u>"), title: "下划线 Ctrl+U" },
    { icon: Strikethrough, action: () => insertMarkdown("~~", "~~"), title: "删除线" },
    { icon: Superscript, action: () => insertMarkdown("<sup>", "</sup>"), title: "上标" },
    { icon: Subscript, action: () => insertMarkdown("<sub>", "</sub>"), title: "下标" },
    { icon: Highlighter, action: () => insertMarkdown("==", "=="), title: "高亮" },
    { icon: Code2, action: () => insertMarkdown("`", "`"), title: "行内代码" },
    { icon: Heading, action: () => setShowHeadingDialog(!showHeadingDialog), title: "标题 H1-H6" },
    { icon: TextCursorInput, action: () => setShowFontFamilyDialog(!showFontFamilyDialog), title: "字体" },
    { icon: Palette, action: () => setShowFontColorDialog(!showFontColorDialog), title: "字体颜色" },
    { icon: Type, action: () => setShowFontSizeDialog(!showFontSizeDialog), title: "字体大小" },
    { icon: AlignVerticalJustifyCenter, action: () => setShowLineHeightDialog(!showLineHeightDialog), title: "行间距" },
    { icon: Columns2, action: () => setShowParagraphSpacingDialog(!showParagraphSpacingDialog), title: "段落间距" },
    { icon: Link2, action: () => insertMarkdown("[", "](url)"), title: "链接 Ctrl+K" },
    { icon: ImageIcon, action: () => document.getElementById("img-upload")?.click(), title: "插入图片" },
    { icon: Code, action: () => setShowCodeBlockLang(true), title: "代码块" },
    { icon: Table2, action: () => setShowTableDialog(true), title: "插入表格" },
    { icon: Quote, action: () => insertQuote(), title: "引用" },
    { icon: List, action: () => insertList("- "), title: "无序列表" },
    { icon: ListOrdered, action: () => insertList("1. "), title: "有序列表" },
    { icon: Footprints, action: insertFootnote, title: "脚注" },
    { icon: MinusIcon, action: () => insertMarkdown("\n---\n"), title: "分隔线" },
    { icon: isFullscreen ? Minimize2 : Maximize2, action: toggleFullscreen, title: isFullscreen ? "退出全屏 Esc" : "全屏" },
  ];

  const renderPreview = (md: string) => {
    if (!md.trim()) return { __html: '<span class="text-[var(--muted)] text-sm">暂无内容</span>' };
    
    // 先处理表格
    let processedMd = md.replace(/\|(.+)\|\n\|[-\s|:]+\|\n((?:\|.+\|\n?)*)/g, (match, headerRow, bodyRows) => {
      const headers = headerRow.split("|").filter((c: string) => c.trim()).map((c: string) => `<th class="px-4 py-3 text-left font-semibold bg-[var(--card)] border-b border-[var(--card-border)]">${c.trim()}</th>`).join("");
      const rows = bodyRows.trim().split("\n").map((row: string) => {
        const cells = row.split("|").filter((c: string) => c.trim()).map((c: string) => `<td class="px-4 py-3 border-b border-[var(--card-border)]">${c.trim()}</td>`).join("");
        return `<tr>${cells}</tr>`;
      }).join("");
      return `<table class="w-full border-collapse my-4 rounded-lg overflow-hidden border border-[var(--card-border)]"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>`;
    });

    let html = processedMd
      // Process <figure> blocks — wrap img with styled container + figcaption
      .replace(/<figure[^>]*class="([^"]*image-block[^"]*)"[^>]*>([\s\S]*?)<\/figure>/gi, (_, cls, inner) => {
        const isSingle = !cls.includes("flex-1");
        const imgMatch = inner.match(/<img[^>]*>/i);
        const imgHtml = imgMatch ? imgMatch[0] : "";
        const captionMatch = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
        const caption = captionMatch ? captionMatch[1] : "";
        const figClass = isSingle
          ? "my-6 text-center"
          : "flex-1 text-center";
        const imgEl = imgHtml.replace(/class="([^"]*)"/, `class="$1 rounded-lg shadow-sm"`);
        return `<div class="${figClass}">${imgEl}${caption ? `<p class="text-xs text-[var(--muted)] mt-2 italic">${caption}</p>` : ""}</div>`;
      })
      // Process double-column <div class="flex gap-4">
      .replace(/<div\s+class="flex\s+gap-4">([\s\S]*?)<\/div>/gi, (_, inner) => {
        return `<div class="flex gap-4 my-6">${inner}</div>`;
      })
      .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
        `<pre class="bg-[var(--code-bg)] text-[var(--code-text)] rounded-lg p-4 my-4 overflow-x-auto text-sm font-mono"><code class="language-${lang}">${code.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</code></pre>`)
      .replace(/^###### (.+)$/gm, "<h6 class='text-sm font-semibold mt-4 mb-2'>$1</h6>")
      .replace(/^##### (.+)$/gm, "<h5 class='text-base font-semibold mt-5 mb-2'>$1</h5>")
      .replace(/^#### (.+)$/gm, "<h4 class='text-lg font-semibold mt-6 mb-3'>$1</h4>")
      .replace(/^### (.+)$/gm, "<h3 class='text-lg font-semibold mt-6 mb-3'>$1</h3>")
      .replace(/^## (.+)$/gm, "<h2 class='text-xl font-bold mt-8 mb-4'>$1</h2>")
      .replace(/^# (.+)$/gm, "<h1 class='text-2xl font-bold mt-8 mb-4'>$1</h1>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/~~(.+?)~~/g, "<del>$1</del>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/==(.+?)==/g, "<mark class='bg-yellow-200 dark:bg-yellow-800 px-1 rounded'>$1</mark>")
      .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-4"/>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[var(--link)] hover:text-[var(--link-hover)] underline underline-offset-2">$1</a>')
      .replace(/`([^`]+?)`/g, '<code class="px-2 py-0.5 rounded bg-[var(--card)] text-[var(--primary)] text-sm font-mono">$1</code>')
      .replace(/^- \[ \] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" disabled class="accent-[var(--primary)]"><span>$1</span></li>')
      .replace(/^- \[x\] (.+)$/gm, '<li class="flex items-center gap-2 my-1"><input type="checkbox" checked disabled class="accent-[var(--primary)]"><span class="line-through text-[var(--muted)]">$1</span></li>')
      .replace(/^- (.+)$/gm, "<li class='ml-4 list-disc my-1'>$1</li>")
      .replace(/^\d+\. (.+)$/gm, "<li class='ml-4 list-decimal my-1'>$1</li>")
      .replace(/^> (.+)$/gm, "<blockquote class='border-l-4 border-[var(--primary)] pl-4 my-4 text-[var(--muted)] italic bg-[var(--card)]/50 py-3 pr-4 rounded-r-lg'>$1</blockquote>")
      .replace(/\$\$(.+?)\$\$/g, '<div class="text-center my-4 p-3 bg-[var(--card)] rounded-lg font-mono">$1</div>')
      .replace(/\$(.+?)\$/g, '<span class="font-mono text-[var(--primary)]">$1</span>')
      .replace(/^---$/gm, '<hr class="border-[var(--card-border)] my-6"/>');

    html = html.replace(/\n\n/g, "<br/><br/>");

    // Process footnotes: extract definitions and render at bottom
    const footnotes: Record<string, string> = {};
    html = html.replace(/\[\^(\d+)\]:\s*(.+?)(?=\n\n|\[\^|$)/g, (_, num, content) => {
      footnotes[num] = content;
      return "";
    });

    // Replace footnote references
    html = html.replace(/\[\^(\d+)\]/g, (_, num) => {
      return `<sup class="text-[var(--primary)] font-semibold cursor-pointer hover:underline">${num}</sup>`;
    });

    // Render footnotes at the bottom
    if (Object.keys(footnotes).length > 0) {
      const fnHtml = Object.entries(footnotes)
        .map(([num, content]) =>
          `<div class="flex gap-2 my-1 text-xs text-[var(--muted)]"><sup class="text-[var(--primary)] font-semibold">${num}.</sup><span>${content}</span></div>`
        )
        .join("");
      html += `<hr class="border-[var(--card-border)] my-6"/><div class="mt-4 pt-4 border-t border-[var(--card-border)]"><h4 class="text-sm font-semibold text-[var(--muted)] mb-2">脚注</h4>${fnHtml}</div>`;
    }
    
    return { __html: html };
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 border-b border-[var(--card-border)] glass">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
              <ArrowLeft className="w-4 h-4" />返回管理
            </Link>
            <span className="text-sm font-medium">写文章</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowFeishuImport(true)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors">
              <Import className="w-3.5 h-3.5" />从飞书导入
            </button>
            <button onClick={() => setShowAiWrite(true)} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--primary)] hover:border-[var(--primary)]/50 transition-colors">
              <Sparkles className="w-3.5 h-3.5" />AI 帮写
            </button>
            <button onClick={clearDraft} className="text-xs text-[var(--muted)] hover:text-red-400 transition-colors">清除草稿</button>
            <span className="text-xs text-[var(--muted)]">
              {getWordCount().total > 0 && `${getWordCount().cn} 中 · ${getWordCount().en} 英`}
            </span>
            <button onClick={publishArticle} disabled={publishing} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50">
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
              {publishing ? "发布中..." : "发布"}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        <div className="space-y-6">
          {/* Meta fields - horizontal layout */}
          <div className="glass rounded-xl p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">标题 <span className="text-red-400">*</span></label>
                <input type="text" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} placeholder="文章标题" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">摘要</label>
                <input type="text" value={articleSummary} onChange={(e) => setArticleSummary(e.target.value)} placeholder="一句话概括（可选）" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">分类</label>
                <select value={articleCategory} onChange={(e) => setArticleCategory(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm">
                  {categories.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">标签（逗号分隔）</label>
                <input type="text" value={articleTags} onChange={(e) => setArticleTags(e.target.value)} placeholder="Spark, LLM, 数据清洗" className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm" />
              </div>
            </div>
          </div>

          {/* Editor - full width */}
          <div ref={editorRef} className="editor-container glass rounded-xl p-5 flex flex-col min-h-[calc(100vh-280px)]">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-3">
              <div className="relative flex-1">
                <div className="flex flex-wrap items-center gap-0.5 p-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)]">
                  {mdToolbar.map((tool, i) => (
                    <div key={i} className="relative group">
                      <button onClick={tool.action} className="p-2 rounded hover:text-[var(--primary)] text-[var(--muted)] hover:bg-[var(--primary)]/10 transition-colors">
                        <tool.icon className="w-4 h-4" />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded bg-[var(--foreground)] text-[var(--card)] text-[11px] whitespace-nowrap pointer-events-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                        {tool.title}
                      </div>
                    </div>
                  ))}
                  <input id="img-upload" type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                </div>

                {showCodeBlockLang && (
                  <div
                    className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl grid grid-cols-4 gap-1 w-72"
                    onMouseLeave={() => setShowCodeBlockLang(false)}
                  >
                    {["javascript", "typescript", "python", "java", "sql", "shell", "bash", "yaml", "markdown", "css", "html", "go", "rust", "swift", "json", "dockerfile"].map((lang) => (
                      <button key={lang} onClick={() => insertCodeBlock(lang)} className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left">
                        {lang}
                      </button>
                    ))}
                  </div>
                )}

                {showHeadingDialog && (
                  <div
                    className="absolute z-40 top-full left-0 mt-1 p-2 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48"
                    onMouseLeave={() => setShowHeadingDialog(false)}
                  >
                    <p className="text-xs text-[var(--muted)] mb-2 px-2">选择标题级别</p>
                    <div className="space-y-1">
                      {[
                        { level: 1, label: "一级标题", prefix: "# " },
                        { level: 2, label: "二级标题", prefix: "## " },
                        { level: 3, label: "三级标题", prefix: "### " },
                        { level: 4, label: "四级标题", prefix: "#### " },
                        { level: 5, label: "五级标题", prefix: "##### " },
                        { level: 6, label: "六级标题", prefix: "###### " },
                      ].map((heading) => (
                        <button
                          key={heading.level}
                          onClick={() => {
                            insertMarkdown(heading.prefix);
                            setShowHeadingDialog(false);
                          }}
                          className="w-full text-left text-sm px-3 py-2 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors flex items-center justify-between"
                        >
                          <span>{heading.label}</span>
                          <span className="text-xs font-mono opacity-50">{heading.prefix}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showTableDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-56">
                    <p className="text-sm text-[var(--foreground)] mb-3">插入表格</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div><label className="text-xs text-[var(--muted)]">行数</label><input type="number" min={2} max={10} value={tableRows} onChange={(e) => setTableRows(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /></div>
                      <div><label className="text-xs text-[var(--muted)]">列数</label><input type="number" min={2} max={6} value={tableCols} onChange={(e) => setTableCols(Number(e.target.value))} className="w-full px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={insertTable} className="flex-1 text-xs px-3 py-1.5 rounded bg-[var(--primary)] text-white">插入</button>
                      <button onClick={() => setShowTableDialog(false)} className="flex-1 text-xs px-3 py-1.5 rounded border border-[var(--card-border)] text-[var(--muted)]">取消</button>
                    </div>
                  </div>
                )}

                {/* Font Family Dialog */}
                {showFontFamilyDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-64"
                    onMouseLeave={() => setShowFontFamilyDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">选择字体</p>
                    {/* Mode toggle */}
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode('selection')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'selection' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode('global')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'global' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {["Arial", "Georgia", "Times New Roman", "Courier New", "Verdana", "Trebuchet MS", "PingFang SC", "Microsoft YaHei", "SimSun", "SimHei"].map((font) => (
                        <button key={font}
                          onClick={() => applyStyle(
                            () => setFontFamily(font),
                            () => { setGlobalStyle('font-family', `'${font}'`); setShowFontFamilyDialog(false); }
                          )}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-left truncate"
                          style={{ fontFamily: font }}>
                          {font}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Font Color Dialog */}
                {showFontColorDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-72"
                    onMouseLeave={() => setShowFontColorDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">选择颜色</p>
                    <div className="grid grid-cols-6 gap-1.5 mb-2">
                      {["#1e293b", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#6b7280", "#94a3b8", "#000000"].map((color) => (
                        <button key={color} onClick={() => setFontColor(color)}
                          className="w-8 h-8 rounded-md border border-[var(--card-border)] hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }} title={color} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="color" value={selectedFontColor} onChange={(e) => setSelectedFontColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0" />
                      <span className="text-xs text-[var(--muted)] font-mono">{selectedFontColor}</span>
                      <button onClick={setCustomFontColor} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white ml-auto">应用</button>
                    </div>
                  </div>
                )}

                {/* Font Size Dialog */}
                {showFontSizeDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48"
                    onMouseLeave={() => setShowFontSizeDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">字体大小 (px)</p>
                    {/* Mode toggle */}
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode('selection')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'selection' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode('global')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'global' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[12, 14, 16, 18, 20, 24, 28, 32, 36].map((size) => (
                        <button key={size}
                          onClick={() => applyStyle(
                            () => setFontSize(size),
                            () => { setGlobalStyle('font-size', `${size}px`); setShowFontSizeDialog(false); }
                          )}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">
                          {size}px
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)]">自定义</label>
                      <input type="number" min={8} max={72} value={customFontSize} onChange={(e) => setCustomFontSize(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" />
                      <button onClick={() => applyStyle(
                        setCustomFontSizeValue,
                        () => { setGlobalStyle('font-size', `${customFontSize}px`); setShowFontSizeDialog(false); }
                      )} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button>
                    </div>
                  </div>
                )}

                {/* Line Height Dialog */}
                {showLineHeightDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48"
                    onMouseLeave={() => setShowLineHeightDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">行间距</p>
                    {/* Mode toggle */}
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode('selection')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'selection' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode('global')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'global' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[1, 1.2, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6].map((value) => (
                        <button key={value}
                          onClick={() => applyStyle(
                            () => setLineHeight(value),
                            () => { setGlobalStyle('line-height', String(value)); setShowLineHeightDialog(false); }
                          )}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">
                          {value}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)]">自定义</label>
                      <input type="number" min={0.5} max={4} step={0.1} value={customLineHeight} onChange={(e) => setCustomLineHeight(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" />
                      <button onClick={() => applyStyle(
                        setCustomLineHeightValue,
                        () => { setGlobalStyle('line-height', String(customLineHeight)); setShowLineHeightDialog(false); }
                      )} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button>
                    </div>
                  </div>
                )}

                {/* Paragraph Spacing Dialog */}
                {showParagraphSpacingDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-48"
                    onMouseLeave={() => setShowParagraphSpacingDialog(false)}>
                    <p className="text-xs text-[var(--muted)] mb-2 px-1">段落间距 (px)</p>
                    {/* Mode toggle */}
                    <div className="flex gap-1 mb-2 px-1">
                      <button onClick={() => setGlobalStyleMode('selection')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'selection' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>仅对选中文字</button>
                      <button onClick={() => setGlobalStyleMode('global')} className={`text-[10px] px-2 py-0.5 rounded transition-colors ${globalStyleMode === 'global' ? 'bg-[var(--primary)] text-white' : 'text-[var(--muted)] hover:bg-[var(--primary)]/10'}`}>通篇应用</button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[4, 8, 12, 16, 20, 24, 32, 40, 48].map((value) => (
                        <button key={value}
                          onClick={() => applyStyle(
                            () => setParagraphSpacing(value),
                            () => { setGlobalStyle('margin-bottom', `${value}px`); setShowParagraphSpacingDialog(false); }
                          )}
                          className="text-xs px-2 py-1.5 rounded text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors text-center">
                          {value}px
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[var(--muted)]">自定义</label>
                      <input type="number" min={0} max={100} value={customParagraphSpacing} onChange={(e) => setCustomParagraphSpacing(Number(e.target.value))}
                        className="w-16 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" />
                      <button onClick={() => applyStyle(
                        setCustomParagraphSpacingValue,
                        () => { setGlobalStyle('margin-bottom', `${customParagraphSpacing}px`); setShowParagraphSpacingDialog(false); }
                      )} className="text-xs px-2 py-1 rounded bg-[var(--primary)] text-white">应用</button>
                    </div>
                  </div>
                )}

                {/* Image Settings Dialog */}
                {showImageDialog && (
                  <div className="absolute z-40 top-full left-0 mt-1 p-4 rounded-lg border border-[var(--card-border)] bg-[var(--card)] shadow-xl w-80"
                    onMouseLeave={() => setShowImageDialog(false)}>
                    <p className="text-sm font-medium text-[var(--foreground)] mb-3">📷 图片设置</p>

                    {/* Image description / alt */}
                    <div className="mb-3">
                      <label className="text-xs text-[var(--muted)] block mb-1">图片描述</label>
                      <input
                        type="text"
                        value={pendingImageAlt}
                        onChange={(e) => setPendingImageAlt(e.target.value)}
                        placeholder="在此输入图片描述..."
                        className="w-full px-2 py-1.5 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50"
                      />
                    </div>

                    {/* Image size */}
                    <div className="mb-3">
                      <label className="text-xs text-[var(--muted)] block mb-1">图片大小</label>
                      <div className="grid grid-cols-4 gap-1.5 mb-2">
                        {[
                          { key: "small", label: "小", sub: "33%" },
                          { key: "medium", label: "中", sub: "66%" },
                          { key: "full", label: "大", sub: "100%" },
                          { key: "custom", label: "自定义", sub: "" },
                        ].map((s) => (
                          <button key={s.key}
                            onClick={() => setImageSize(s.key as typeof imageSize)}
                            className={`text-xs px-2 py-1.5 rounded transition-colors text-center ${imageSize === s.key ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>
                            {s.label}
                            {s.sub && <span className="block text-[10px] opacity-60">{s.sub}</span>}
                          </button>
                        ))}
                      </div>
                      {imageSize === "custom" && (
                        <div className="flex items-center gap-2">
                          <input type="number" min={50} max={2000} value={customImageWidth} onChange={(e) => setCustomImageWidth(Number(e.target.value))}
                            className="w-20 px-2 py-1 rounded border border-[var(--card-border)] bg-[var(--card)] text-sm text-[var(--foreground)]" />
                          <span className="text-xs text-[var(--muted)]">px</span>
                        </div>
                      )}
                    </div>

                    {/* Image layout */}
                    <div className="mb-4">
                      <label className="text-xs text-[var(--muted)] block mb-1">排版方式</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { key: "single", label: "单图", icon: "🖼️" },
                          { key: "double", label: "双栏并排", icon: "🖼️️" },
                        ].map((l) => (
                          <button key={l.key}
                            onClick={() => setImageLayout(l.key as typeof imageLayout)}
                            className={`text-xs px-2 py-2 rounded transition-colors text-center ${imageLayout === l.key ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:bg-[var(--primary)]/10"}`}>
                            <span className="text-sm">{l.icon}</span>
                            <span className="block">{l.label}</span>
                          </button>
                        ))}
                      </div>
                      {imageLayout === "double" && (
                        <p className="text-[10px] text-[var(--muted)] mt-1">
                          {doubleImageQueue.length === 0
                            ? "📌 先插入第一张图，再上传第二张完成排版"
                            : `✅ 已选第一张，请再上传一张`}
                        </p>
                      )}
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button onClick={insertImageWithSettings} className="flex-1 text-xs px-3 py-1.5 rounded bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition-colors">
                        {imageLayout === "double" && doubleImageQueue.length === 0 ? "插入第一张" : "插入"}
                      </button>
                      <button onClick={cancelImageInsert} className="flex-1 text-xs px-3 py-1.5 rounded border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setShowPreview(!showPreview)} className={`ml-3 inline-flex items-center gap-1 text-xs px-3 py-2 rounded-lg transition-colors ${showPreview ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "text-[var(--muted)] hover:text-[var(--primary)] border border-[var(--card-border)]"}`}>
                <Eye className="w-3.5 h-3.5" />{showPreview ? "关闭预览" : "预览"}
              </button>
            </div>

            {/* Editor area */}
            <div className={`flex-1 flex gap-4 min-h-0`}>
              <div className={`${showPreview ? "flex-1" : "w-full"} flex flex-col`}>
                <textarea
                  id="article-content"
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  placeholder={"## 标题\n\n正文内容，支持 Markdown 语法..."}
                  className="flex-1 w-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 resize-none font-mono text-sm min-h-[600px]"
                />
              </div>
              {showPreview && (
                <div className="flex-1 overflow-auto">
                  <div
                    className="h-full px-4 py-3 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] min-h-[600px] prose-custom"
                    dangerouslySetInnerHTML={renderPreview(articleContent)}
                  />
                </div>
              )}
            </div>
            {uploadedImageUrl && <p className="text-xs text-[var(--muted)] mt-2">已上传图片: {uploadedImageUrl}</p>}
          </div>
        </div>
      </div>

      {/* Feishu Import Modal */}
      {showFeishuImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowFeishuImport(false)}>
          <div className="glass rounded-2xl p-6 mx-4 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">从飞书导入</h3>
              <button onClick={() => setShowFeishuImport(false)} className="p-1 rounded text-[var(--muted)] hover:text-[var(--foreground)]"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-[var(--muted)] mb-4">粘贴飞书文档链接，自动抓取内容并转换为 Markdown</p>
            <input
              type="text"
              value={feishuUrl}
              onChange={(e) => setFeishuUrl(e.target.value)}
              placeholder="https://xxx.feishu.cn/docx/xxx 或 /wiki/xxx"
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/50 text-sm"
              onKeyDown={(e) => e.key === "Enter" && importFromFeishu()}
            />
            {feishuError && <p className="text-sm text-red-400 mt-2">{feishuError}</p>}
            <div className="flex gap-3 mt-4">
              <button
                onClick={importFromFeishu}
                disabled={feishuLoading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50"
              >
                {feishuLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {feishuLoading ? "导入中..." : "导入"}
              </button>
              <button
                onClick={() => setShowFeishuImport(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Write Modal */}
      <AiWriteModal
        isOpen={showAiWrite}
        onClose={() => setShowAiWrite(false)}
        onInsert={handleAiInsert}
      />

      {/* Publish Success */}
      {publishResult?.success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPublishResult(null)}>
          <div className="glass rounded-2xl p-8 mx-4 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">发布成功</h3>
            <p className="text-sm text-[var(--muted)] mb-6">文章 {publishResult.fileName} 已发布</p>
            <div className="flex gap-3">
              <a href={`/blog/${publishResult.fileName?.replace(".md", "")}`} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
                <FileIcon className="w-4 h-4" />查看文章
              </a>
              <button onClick={() => setPublishResult(null)} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--card-border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/50 transition-colors">
                <Pencil className="w-4 h-4" />再写一篇
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Publish Error */}
      {publishResult && !publishResult.success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPublishResult(null)}>
          <div className="glass rounded-2xl p-8 mx-4 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <X className="w-7 h-7 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">发布失败</h3>
            <p className="text-sm text-[var(--muted)] mb-6">{publishResult.message}</p>
            <button onClick={() => setPublishResult(null)} className="px-5 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm hover:bg-[var(--primary-hover)] transition-colors">
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
