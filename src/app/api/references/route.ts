import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const refs = await prisma.reference.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ references: refs });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const category =
    typeof body.category === "string" ? body.category.trim() : "爽点场景";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!content) {
    return NextResponse.json({ error: "内容不能为空" }, { status: 400 });
  }

  const ref = await prisma.reference.create({ data: { category, content } });
  return NextResponse.json(ref, { status: 201 });
}
