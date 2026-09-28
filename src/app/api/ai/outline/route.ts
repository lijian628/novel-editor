import { NextResponse } from "next/server";
import { getAiConfig, createClient, parseJson } from "@/lib/ai";

type OutlineItem = { title: string; summary: string; hook: string };

const SYSTEM = `你是短篇爽文策划。根据梗概，写一个 6~10 节的分节大纲，用于写一篇 5000~10000 字的短篇爽文。

每节包含：小标题（钩子型）+ 2~3 句剧情 + 爽点/钩子标注。
整体要求：第 1 节就要抓人；爽点逐节递进、不重复；结尾要有反转或余味。

用 JSON 返回，格式：{"sections":[{"title":"小节标题","summary":"剧情概述","hook":"爽点/钩子标注"}]}`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const synopsis = body?.synopsis;
  const summary = typeof synopsis?.summary === "string" ? synopsis.summary : "";
  const title = typeof synopsis?.title === "string" ? synopsis.title : "";
  if (!summary) {
    return NextResponse.json({ error: "缺少梗概" }, { status: 400 });
  }

  const config = await getAiConfig();
  if (!config) {
    return NextResponse.json({ error: "未配置 AI，请先到「AI 设置」填 API Key" }, { status: 400 });
  }

  try {
    const client = createClient(config);
    const completion = await client.chat.completions.create({
      model: config.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `标题：${title}\n梗概：${summary}` },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = parseJson<{ sections?: OutlineItem[] }>(raw);
    return NextResponse.json({ sections: parsed?.sections ?? [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "调用失败" },
      { status: 500 },
    );
  }
}
