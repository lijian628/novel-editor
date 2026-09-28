import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { countWords } from "@/lib/wordcount";

export async function GET() {
  const stories = await prisma.story.findMany({
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      wordCount: true,
      status: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(stories);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const title =
    typeof body?.title === "string" && body.title.trim()
      ? body.title.trim()
      : "未命名";
  const content = typeof body?.content === "string" ? body.content : "";
  const summary = typeof body?.summary === "string" ? body.summary : null;

  const story = await prisma.story.create({
    data: { title, content, summary, wordCount: countWords(content) },
  });
  return NextResponse.json(story, { status: 201 });
}
