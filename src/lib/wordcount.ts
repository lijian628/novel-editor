// 中文字数：去掉所有空白后按字符计数（网文常用口径，含标点）
export function countWords(text: string): number {
  return text.replace(/\s/g, "").length;
}
