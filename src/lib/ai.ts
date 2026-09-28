import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

export type AiConfig = {
  baseUrl: string;
  model: string;
  apiKey: string;
};

// 读取默认 AI 配置（未配置或没填 key 时返回 null）
export async function getAiConfig(): Promise<AiConfig | null> {
  const profile =
    (await prisma.aiProfile.findFirst({ where: { isDefault: true } })) ??
    (await prisma.aiProfile.findFirst());
  if (!profile || !profile.apiKey) return null;
  return {
    baseUrl: profile.baseUrl,
    model: profile.model,
    apiKey: profile.apiKey,
  };
}

export function createClient(config: AiConfig) {
  return new OpenAI({ baseURL: config.baseUrl, apiKey: config.apiKey });
}

export type Reference = { category: string; content: string };

// 读取范文库（用于生成时注入文风参考）
export async function getReferences(): Promise<Reference[]> {
  const refs = await prisma.reference.findMany({
    orderBy: { createdAt: "asc" },
    take: 20,
  });
  return refs.map((r) => ({ category: r.category, content: r.content }));
}

// 把范文拼成提示词片段
export function buildStylePrompt(refs: Reference[]): string {
  if (refs.length === 0) return "";
  const lines = refs
    .map((r, i) => `【范文${i + 1}｜${r.category}】\n${r.content}`)
    .join("\n\n");
  return `\n\n以下是几段爆款爽文范文，请严格模仿其文风和爽感节奏：\n${lines}\n`;
}

// 稳健解析模型输出的 JSON（模型可能输出 ```json 代码块或前后废话）
export function parseJson<T>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/gi, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 截取第一个 [ 或 { 到最后一个 ] 或 }
    const arrStart = cleaned.indexOf("[");
    const objStart = cleaned.indexOf("{");
    let start = -1;
    let end = -1;
    if (arrStart !== -1 && (objStart === -1 || arrStart < objStart)) {
      start = arrStart;
      end = cleaned.lastIndexOf("]");
    } else if (objStart !== -1) {
      start = objStart;
      end = cleaned.lastIndexOf("}");
    }
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1)) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}
