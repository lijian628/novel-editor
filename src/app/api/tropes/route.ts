import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tropes = await prisma.trope.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ tropes });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim() : null;

  if (!title || !category || !content) {
    return NextResponse.json({ error: "标题、分类、内容不能为空" }, { status: 400 });
  }

  const trope = await prisma.trope.create({
    data: { title, category, content, notes },
  });
  return NextResponse.json(trope, { status: 201 });
}
