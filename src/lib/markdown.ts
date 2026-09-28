// 把 Markdown 简化成纯文本（用于导出 txt）
export function stripMarkdown(md: string): string {
  return md
    .replace(/^#{1,6}\s+/gm, "") // 标题 #
    .replace(/\*\*([^*]+)\*\*/g, "$1") // 加粗
    .replace(/\*([^*]+)\*/g, "$1") // 斜体
    .replace(/`([^`]+)`/g, "$1"); // 行内代码
}
