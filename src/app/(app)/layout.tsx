import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const stories = await prisma.story.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, wordCount: true, status: true },
  });

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar stories={stories} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
