import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const snaps = await prisma.storySnapshot.findMany({
    where: { storyId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({
    snapshots: snaps.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      content: s.content,
    })),
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const content = typeof body?.content === "string" ? body.content : "";
  const snap = await prisma.storySnapshot.create({
    data: { storyId: id, content },
  });
  return NextResponse.json({ id: snap.id, createdAt: snap.createdAt });
}
