/**
 * 命令面板的轻量事件总线：与重组件（含 fuse.js）解耦。
 * Header 等触发方只需 import 本文件，不会把整个 CommandPalette 模块拉进首屏 bundle。
 */
export const COMMAND_PALETTE_OPEN_EVENT = "command-palette:open";

/** 触发命令面板打开（供 Header 搜索按钮等调用）。 */
export function openCommandPalette() {
  window.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
}
