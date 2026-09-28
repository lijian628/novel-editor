import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const baseUrl = typeof body.baseUrl === "string" ? body.baseUrl.trim() : "";
  const model = typeof body.model === "string" ? body.model.trim() : "";
  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";

  if (!baseUrl || !model) {
    return NextResponse.json(
      { error: "API 地址和模型名不能为空" },
      { status: 400 },
    );
  }

  const existing = await prisma.aiProfile.findFirst({
    where: { isDefault: true },
  });

  // 留空则不覆盖已有 key
  const data: { baseUrl: string; model: string; apiKey?: string } = {
    baseUrl,
    model,
  };
  if (apiKey) data.apiKey = apiKey;

  if (existing) {
    await prisma.aiProfile.update({ where: { id: existing.id }, data });
  } else {
    await prisma.aiProfile.create({
      data: { name: "默认", ...data, apiKey: apiKey || "", isDefault: true },
    });
  }

  return NextResponse.json({ ok: true });
}
