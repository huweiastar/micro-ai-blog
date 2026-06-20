const FEISHU_BASE = "https://open.feishu.cn/open-apis";

// 飞书 docx 文档块的最小化结构（仅声明本文件实际读取的字段）。
interface FeishuTextElement {
  text_run?: {
    content?: string;
    text_element_style?: {
      bold?: boolean;
      italic?: boolean;
      strikethrough?: boolean;
      inline_code?: boolean;
      link?: { url?: string };
    };
  };
}

interface FeishuTextBody {
  elements?: FeishuTextElement[];
}

interface FeishuBlock {
  block_type: number;
  text?: FeishuTextBody;
  heading1?: FeishuTextBody;
  heading2?: FeishuTextBody;
  heading3?: FeishuTextBody;
  heading4?: FeishuTextBody;
  heading5?: FeishuTextBody;
  heading6?: FeishuTextBody;
  bullet?: FeishuTextBody;
  ordered?: FeishuTextBody;
  quote?: FeishuTextBody;
  callout?: FeishuTextBody;
  code?: { style?: { language?: number } };
  todo?: FeishuTextBody & { style?: { done?: boolean } };
  image?: { token?: string };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  if (!appId || !appSecret) {
    throw new Error("请配置 FEISHU_APP_ID 和 FEISHU_APP_SECRET 环境变量");
  }

  const res = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });

  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`获取飞书 token 失败: ${data.msg}`);
  }

  cachedToken = {
    token: data.tenant_access_token,
    expiresAt: Date.now() + (data.expire - 60) * 1000,
  };
  return cachedToken.token;
}

export function parseFeishuUrl(url: string): { type: "docx" | "wiki"; token: string } {
  const u = new URL(url);
  if (!u.hostname.includes("feishu.cn") && !u.hostname.includes("larksuite.com")) {
    throw new Error("不是有效的飞书文档链接");
  }

  const path = u.pathname;

  // /docx/TOKEN or /docs/TOKEN
  const docxMatch = path.match(/\/(?:docx|docs)\/([A-Za-z0-9]+)/);
  if (docxMatch) return { type: "docx", token: docxMatch[1] };

  // /wiki/TOKEN
  const wikiMatch = path.match(/\/wiki\/([A-Za-z0-9]+)/);
  if (wikiMatch) return { type: "wiki", token: wikiMatch[1] };

  throw new Error("无法识别的飞书文档链接格式，支持 /docx/、/docs/、/wiki/ 类型");
}

async function resolveWikiToken(wikiToken: string, accessToken: string): Promise<string> {
  const res = await fetch(`${FEISHU_BASE}/wiki/v2/spaces/get_node?token=${wikiToken}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.code !== 0) {
    throw new Error(`解析知识库文档失败: ${data.msg}`);
  }
  return data.data.node.obj_token;
}

async function fetchDocBlocks(docToken: string, accessToken: string): Promise<FeishuBlock[]> {
  const blocks: FeishuBlock[] = [];
  let pageToken = "";

  while (true) {
    const url = `${FEISHU_BASE}/docx/v1/documents/${docToken}/blocks?page_size=500${pageToken ? `&page_token=${pageToken}` : ""}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    if (data.code !== 0) {
      throw new Error(`获取文档内容失败: ${data.msg}`);
    }
    blocks.push(...(data.data.items || []));
    if (!data.data.has_more) break;
    pageToken = data.data.page_token;
  }

  return blocks;
}

async function getDocTitle(docToken: string, accessToken: string): Promise<string> {
  const res = await fetch(`${FEISHU_BASE}/docx/v1/documents/${docToken}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();
  if (data.code !== 0) return "";
  return data.data.document.title || "";
}

function textElementsToString(elements?: FeishuTextElement[]): string {
  if (!elements) return "";
  return elements
    .map((el) => {
      if (!el.text_run) return "";
      const text = el.text_run.content || "";
      const style = el.text_run.text_element_style;
      if (!style) return text;

      let result = text;
      if (style.bold) result = `**${result}**`;
      if (style.italic) result = `*${result}*`;
      if (style.strikethrough) result = `~~${result}~~`;
      if (style.inline_code) result = `\`${result}\``;
      if (style.link?.url) {
        const decodedUrl = decodeURIComponent(style.link.url);
        result = `[${result}](${decodedUrl})`;
      }
      return result;
    })
    .join("");
}

function blocksToMarkdown(blocks: FeishuBlock[]): string {
  const lines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeLines: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let currentTableRow: string[] = [];

  for (const block of blocks) {
    const type = block.block_type;

    // Handle code block end
    if (inCodeBlock && type !== 14) {
      lines.push(`\`\`\`${codeBlockLang}`);
      lines.push(...codeLines);
      lines.push("```");
      lines.push("");
      inCodeBlock = false;
      codeLines = [];
      codeBlockLang = "";
    }

    // Handle table end
    if (inTable && type !== 18 && type !== 19) {
      if (currentTableRow.length > 0) {
        tableRows.push(currentTableRow);
        currentTableRow = [];
      }
      lines.push(...renderTable(tableRows));
      inTable = false;
      tableRows = [];
    }

    switch (type) {
      case 1: // Page block (skip, it's the root)
        break;

      case 2: // Text
        lines.push(textElementsToString(block.text?.elements));
        lines.push("");
        break;

      case 3: // Heading 1
        lines.push(`# ${textElementsToString(block.heading1?.elements)}`);
        lines.push("");
        break;

      case 4: // Heading 2
        lines.push(`## ${textElementsToString(block.heading2?.elements)}`);
        lines.push("");
        break;

      case 5: // Heading 3
        lines.push(`### ${textElementsToString(block.heading3?.elements)}`);
        lines.push("");
        break;

      case 6: // Heading 4
        lines.push(`#### ${textElementsToString(block.heading4?.elements)}`);
        lines.push("");
        break;

      case 7: // Heading 5
        lines.push(`##### ${textElementsToString(block.heading5?.elements)}`);
        lines.push("");
        break;

      case 8: // Heading 6
        lines.push(`###### ${textElementsToString(block.heading6?.elements)}`);
        lines.push("");
        break;

      case 9: // Unordered list
        lines.push(`- ${textElementsToString(block.bullet?.elements)}`);
        break;

      case 10: // Ordered list
        lines.push(`1. ${textElementsToString(block.ordered?.elements)}`);
        break;

      case 11: // Code block start
        inCodeBlock = true;
        codeBlockLang = block.code?.style?.language
          ? mapCodeLanguage(block.code.style.language)
          : "";
        break;

      case 14: // Code block body text
        if (inCodeBlock) {
          codeLines.push(textElementsToString(block.text?.elements));
        }
        break;

      case 12: // Quote
        lines.push(`> ${textElementsToString(block.quote?.elements)}`);
        lines.push("");
        break;

      case 15: // Divider
        lines.push("---");
        lines.push("");
        break;

      case 17: // Table (start)
        inTable = true;
        break;

      case 18: // Table row
        if (currentTableRow.length > 0) {
          tableRows.push(currentTableRow);
        }
        currentTableRow = [];
        break;

      case 19: // Table cell
        currentTableRow.push(textElementsToString(block.text?.elements || []));
        break;

      case 22: // Todo / task list
        {
          const done = block.todo?.style?.done;
          const text = textElementsToString(block.todo?.elements);
          lines.push(`- [${done ? "x" : " "}] ${text}`);
        }
        break;

      case 23: // Callout
        lines.push(`> ${textElementsToString(block.callout?.elements)}`);
        lines.push("");
        break;

      case 27: // Image
        {
          const imageToken = block.image?.token;
          if (imageToken) {
            lines.push(`![图片](feishu-image://${imageToken})`);
            lines.push("");
          }
        }
        break;

      default:
        // Unknown block type, try to extract text
        if (block.text?.elements) {
          lines.push(textElementsToString(block.text.elements));
          lines.push("");
        }
        break;
    }
  }

  // Flush remaining code block
  if (inCodeBlock) {
    lines.push(`\`\`\`${codeBlockLang}`);
    lines.push(...codeLines);
    lines.push("```");
    lines.push("");
  }

  // Flush remaining table
  if (inTable) {
    if (currentTableRow.length > 0) {
      tableRows.push(currentTableRow);
    }
    lines.push(...renderTable(tableRows));
  }

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function renderTable(rows: string[][]): string[] {
  if (rows.length === 0) return [];
  const lines: string[] = [];
  const colCount = Math.max(...rows.map((r) => r.length));

  // Header row
  const header = rows[0];
  lines.push(`| ${Array.from({ length: colCount }, (_, i) => header[i] || "").join(" | ")} |`);
  lines.push(`| ${Array.from({ length: colCount }, () => "---").join(" | ")} |`);

  // Data rows
  for (let i = 1; i < rows.length; i++) {
    lines.push(`| ${Array.from({ length: colCount }, (_, j) => rows[i][j] || "").join(" | ")} |`);
  }
  lines.push("");
  return lines;
}

function mapCodeLanguage(lang: number): string {
  const langMap: Record<number, string> = {
    1: "plaintext", 2: "abap", 3: "ada", 4: "apache", 5: "apex",
    6: "assembly", 7: "bash", 8: "c", 9: "csharp", 10: "cpp",
    11: "cobol", 12: "css", 13: "coffeescript", 14: "d", 15: "dart",
    16: "delphi", 17: "django", 18: "dockerfile", 19: "erlang", 20: "fortran",
    21: "foxpro", 22: "go", 23: "groovy", 24: "html", 25: "haskell",
    26: "http", 27: "json", 28: "java", 29: "javascript", 30: "julia",
    31: "kotlin", 32: "latex", 33: "lisp", 34: "lua", 35: "matlab",
    36: "makefile", 37: "markdown", 38: "nginx", 39: "objectivec", 40: "opencl",
    41: "php", 42: "perl", 43: "powershell", 44: "prolog", 45: "python",
    46: "r", 47: "rust", 48: "ruby", 49: "sas", 50: "scala",
    51: "scheme", 52: "scss", 53: "shell", 54: "sql", 55: "swift",
    56: "thrift", 57: "typescript", 58: "vbnet", 59: "visual-basic", 60: "xml",
    61: "yaml",
  };
  return langMap[lang] || "plaintext";
}

export async function fetchFeishuDocument(url: string): Promise<{ title: string; content: string }> {
  const { type, token } = parseFeishuUrl(url);
  const accessToken = await getAccessToken();

  let docToken = token;
  if (type === "wiki") {
    docToken = await resolveWikiToken(token, accessToken);
  }

  const [title, blocks] = await Promise.all([
    getDocTitle(docToken, accessToken),
    fetchDocBlocks(docToken, accessToken),
  ]);

  const content = blocksToMarkdown(blocks);
  return { title, content };
}
