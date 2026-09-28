import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; markerId: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { markerId } = await params;
  await prisma.marker.delete({ where: { id: markerId } });
  return NextResponse.json({ ok: true });
}
