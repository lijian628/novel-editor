import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  const markers = await prisma.marker.findMany({
    where: { storyId: id },
    orderBy: { position: "asc" },
  });
  return NextResponse.json({
    markers: markers.map((m) => ({
      id: m.id,
      type: m.type,
      position: m.position,
      note: m.note,
    })),
  });
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const type = typeof body.type === "string" ? body.type : "爽点";
  const position = typeof body.position === "number" ? body.position : 0;
  const note = typeof body.note === "string" ? body.note : null;

  const marker = await prisma.marker.create({
    data: { storyId: id, type, position, note },
  });
  return NextResponse.json(marker);
}
