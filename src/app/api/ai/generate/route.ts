import { NextResponse } from "next/server";
import { getAiConfig, createClient } from "@/lib/ai";

type OutlineItem = { title: string; summary: string; hook: string };
type Synopsis = { title: string; summary: string };

const SYSTEM = `你是资深短篇爽文写手。根据梗概和大纲写正文，要求：
- 第三人称，口语化，节奏快
- 爽点突出，打脸/反转要解气
- 对话生动，场景感强
- 每节结尾留钩子（最后一节给反转/余味）
- 直接输出正文，不要小标题，不要解释`;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const synopsis: Synopsis | undefined = body?.synopsis;
  const outline: OutlineItem[] = Array.isArray(body?.outline)
    ? body.outline
    : [];
  if (!synopsis?.summary || outline.length === 0) {
    return NextResponse.json({ error: "缺少梗概或大纲" }, { status: 400 });
  }

  const config = await getAiConfig();
  if (!config) {
    return NextResponse.json({ error: "未配置 AI，请先到「AI 设置」填 API Key" }, { status: 400 });
  }

  const outlineText = outline
    .map((o, i) => `${i + 1}. ${o.title}（${o.hook || "推进"}）：${o.summary}`)
    .join("\n");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = createClient(config);
        for (let i = 0; i < outline.length; i++) {
          controller.enqueue(encoder.encode(`\n\n## ${outline[i].title}\n\n`));
          const completion = await client.chat.completions.create({
            model: config.model,
            stream: true,
            messages: [
              { role: "system", content: SYSTEM },
              {
                role: "user",
                content: `标题：${synopsis.title}\n梗概：${synopsis.summary}\n\n完整大纲：\n${outlineText}\n\n现在写第 ${i + 1} 节「${outline[i].title}」的正文，约 800 字。直接写正文。`,
              },
            ],
          });
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (e) {
        controller.error(e);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
