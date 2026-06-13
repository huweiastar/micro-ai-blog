import {
  Code2, FileCode, FileCode2, FileJson, Braces, Hash, Binary, Variable,
  FunctionSquare, Sigma, Pi, Calculator, Infinity as InfinityIcon, Atom,
  Database, DatabaseZap, Table2, Server, ServerCog, HardDrive, MemoryStick,
  Cpu, CpuIcon, CircuitBoard, Container, Box, Boxes, Package, Network,
  Layers, Layers3, Component, Puzzle, Workflow,
  Zap, Flame, Rocket, Activity, Gauge,
  Brain, BrainCircuit, BrainCog, Bot, Sparkles, WandSparkles, Wand2,
  Lightbulb, Dna, Orbit,
  Cloud, CloudCog, Cloudy, Globe, Wifi, Radio, Antenna, Satellite,
  Webhook, Share2, Link2,
  GitBranch, GitMerge, GitPullRequest, GitFork, GitCommitHorizontal, Github,
  Terminal, TerminalSquare, SquareTerminal, Cog, Settings, Wrench, Hammer, Bug,
  BarChart3, LineChart, PieChart, TrendingUp, Radar,
  Lock, Key, KeyRound, Shield, ShieldCheck, Fingerprint, Eye, Search, Filter,
  FlaskConical, FlaskRound, TestTube, TestTubeDiagonal, Microscope, Telescope,
  type LucideIcon,
} from "lucide-react";

/**
 * 技术栈标签可选图标注册表。
 * key 为存储在 profile.yaml 中的稳定字符串，value 为对应的 lucide 组件。
 * 在首页渲染与后台选择器之间共享，确保两端图标一致。
 *
 * 若标签的 icon 不在此表中（例如管理员填入了 emoji 或自定义文字），
 * 则由 <TechIcon> 直接把该字符串作为文本渲染 —— 因此图标实际上是无限的。
 */
export const TECH_ICONS: Record<string, LucideIcon> = {
  // 编程语言 / 数学
  code: Code2,
  "file-code": FileCode,
  "file-code2": FileCode2,
  json: FileJson,
  braces: Braces,
  hash: Hash,
  binary: Binary,
  variable: Variable,
  function: FunctionSquare,
  sigma: Sigma,
  pi: Pi,
  calculator: Calculator,
  infinity: InfinityIcon,
  atom: Atom,
  // 数据 / 基础设施
  database: Database,
  "database-zap": DatabaseZap,
  table: Table2,
  server: Server,
  "server-cog": ServerCog,
  "hard-drive": HardDrive,
  memory: MemoryStick,
  cpu: Cpu,
  cpu2: CpuIcon,
  circuit: CircuitBoard,
  container: Container,
  box: Box,
  boxes: Boxes,
  package: Package,
  network: Network,
  layers: Layers,
  layers3: Layers3,
  component: Component,
  puzzle: Puzzle,
  workflow: Workflow,
  // 性能 / 运行
  zap: Zap,
  flame: Flame,
  rocket: Rocket,
  activity: Activity,
  gauge: Gauge,
  // AI / 大模型
  brain: Brain,
  "brain-circuit": BrainCircuit,
  "brain-cog": BrainCog,
  bot: Bot,
  sparkles: Sparkles,
  "wand-sparkles": WandSparkles,
  wand: Wand2,
  lightbulb: Lightbulb,
  dna: Dna,
  orbit: Orbit,
  // 云 / 网络
  cloud: Cloud,
  "cloud-cog": CloudCog,
  cloudy: Cloudy,
  globe: Globe,
  wifi: Wifi,
  radio: Radio,
  antenna: Antenna,
  satellite: Satellite,
  webhook: Webhook,
  share: Share2,
  link: Link2,
  // 版本控制
  git: GitBranch,
  "git-merge": GitMerge,
  "git-pr": GitPullRequest,
  "git-fork": GitFork,
  "git-commit": GitCommitHorizontal,
  github: Github,
  // 工具链
  terminal: Terminal,
  "terminal-square": TerminalSquare,
  "square-terminal": SquareTerminal,
  cog: Cog,
  settings: Settings,
  wrench: Wrench,
  hammer: Hammer,
  bug: Bug,
  // 分析
  "bar-chart": BarChart3,
  "line-chart": LineChart,
  "pie-chart": PieChart,
  "trending-up": TrendingUp,
  radar: Radar,
  // 安全 / 检索
  lock: Lock,
  key: Key,
  "key-round": KeyRound,
  shield: Shield,
  "shield-check": ShieldCheck,
  fingerprint: Fingerprint,
  eye: Eye,
  search: Search,
  filter: Filter,
  // 科研
  flask: FlaskConical,
  "flask-round": FlaskRound,
  "test-tube": TestTube,
  "test-tube2": TestTubeDiagonal,
  microscope: Microscope,
  telescope: Telescope,
};

/** 后台选择器中展示的图标顺序 */
export const TECH_ICON_KEYS = Object.keys(TECH_ICONS);

/** 兜底图标键名 */
export const DEFAULT_TECH_ICON = "code";

/** 该字符串是否是注册表中的预设图标 key */
export function isPresetIcon(key: string): boolean {
  return key in TECH_ICONS;
}

/**
 * 渲染一个技术栈图标：
 * - 若 icon 是注册表中的预设 key → 渲染对应 lucide 组件
 * - 否则把 icon 字符串本身作为文本/emoji 渲染（支持自定义无限图标）
 */
export function TechIcon({ icon, className }: { icon: string; className?: string }) {
  const Comp = TECH_ICONS[icon];
  if (Comp) return <Comp className={className} />;
  // 自定义 emoji / 文字：用 span 承载，沿用同样的尺寸类
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "1em", lineHeight: 1 }}>
      {icon}
    </span>
  );
}
