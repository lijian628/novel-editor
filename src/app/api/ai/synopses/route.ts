import { NextResponse } from "next/server";
import { getAiConfig, createClient, parseJson } from "@/lib/ai";

type Synopsis = { title: string; tags: string[]; summary: string };

const SYSTEM = `你是一位资深短篇爽文策划，擅长提炼钩子型故事梗概。

根据用户的想法和指定的风格，创作 4 个短篇爽文梗概。每个梗概 150~250 字，必须包含：
1. 一句钩子式开头（有反差、抓人）
2. 主角设定 + 金手指/身份背景
3. 核心冲突（憋屈点）
4. 2~3 个爽点/反转节点
5. 结局走向

4 个梗概要差异化：不同的设定方向、剧情走向。标题要是钩子型（类似「退婚当天，我把凤凰男甩了」）。

用 JSON 返回，格式：{"items":[{"title":"梗概标题","tags":["爽点类型"],"summary":"梗概正文"}]}`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const idea = typeof body?.idea === "string" ? body.idea.trim() : "";
  if (!idea) {
    return NextResponse.json({ error: "请先输入想法" }, { status: 400 });
  }
  const genres = Array.isArray(body?.genres)
    ? body.genres.filter((g: unknown): g is string => typeof g === "string")
    : [];

  const config = await getAiConfig();
  if (!config) {
    return NextResponse.json(
      { error: "未配置 AI，请先到「AI 设置」填 API Key" },
      { status: 400 },
    );
  }

  try {
    const client = createClient(config);
    const completion = await client.chat.completions.create({
      model: config.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `${genres.length ? `风格要求：${genres.join("、")}\n` : ""}想法：${idea}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseJson<{ items?: Synopsis[] }>(raw);
    return NextResponse.json({ items: parsed?.items ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "调用失败" },
      { status: 500 },
    );
  }
}
