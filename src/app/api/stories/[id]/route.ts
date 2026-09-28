import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const data: {
    title?: string;
    content?: string;
    wordCount?: number;
    status?: string;
  } = {};
  if (typeof body.title === "string") data.title = body.title;
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.wordCount === "number") data.wordCount = body.wordCount;
  if (typeof body.status === "string") data.status = body.status;

  const story = await prisma.story.update({ where: { id }, data });
  return NextResponse.json(story);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  await prisma.story.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
