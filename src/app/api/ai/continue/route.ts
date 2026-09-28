import { NextResponse } from "next/server";
import {
  getAiConfig,
  createClient,
  getReferences,
  buildStylePrompt,
} from "@/lib/ai";

const SYSTEM_BASE = `你是资深爆款爽文写手。请接着正文继续往下写，保持文风、设定和节奏一致，结尾留钩子。要求：短句快节奏、对话有火药味、爽点密集、打脸解气。直接写续写内容，不要解释、不要小标题。`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title : "";
  const summary = typeof body.summary === "string" ? body.summary : "";
  const context = typeof body.context === "string" ? body.context : "";

  if (!context) {
    return NextResponse.json({ error: "正文为空" }, { status: 400 });
  }

  const config = await getAiConfig();
  if (!config) {
    return NextResponse.json(
      { error: "未配置 AI，请先到「AI 设置」填 API Key" },
      { status: 400 },
    );
  }

  const refs = await getReferences();
  const system = SYSTEM_BASE + buildStylePrompt(refs);

  const user = `${title ? `标题：${title}\n` : ""}${
    summary ? `梗概：${summary}\n` : ""
  }\n前文：\n${context}\n\n请续写下一段。`;

  try {
    const client = createClient(config);
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "调用失败" },
      { status: 500 },
    );
  }
}
