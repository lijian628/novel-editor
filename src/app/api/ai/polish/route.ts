import { NextResponse } from "next/server";
import { getAiConfig, createClient } from "@/lib/ai";

const MODES: Record<string, string> = {
  润色: "改写得更流畅、更有文采，保持原意和文风",
  纠错: "修正错别字、病句、标点，不改动原意",
  扩写: "在保持原意的基础上展开细节，写得更充实",
  精简: "删繁就简，表达更精炼",
};

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const mode =
    typeof body.mode === "string" && MODES[body.mode] ? body.mode : "润色";

  if (!text) {
    return NextResponse.json({ error: "没有选中文字" }, { status: 400 });
  }

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
      messages: [
        {
          role: "system",
          content: "你是文字编辑。直接输出修改后的文字，不要任何解释或引号。",
        },
        {
          role: "user",
          content: `请对下面这段文字进行「${mode}」：${MODES[mode]}。\n\n原文：\n${text}`,
        },
      ],
    });
    const result = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ text: result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "调用失败" },
      { status: 500 },
    );
  }
}
