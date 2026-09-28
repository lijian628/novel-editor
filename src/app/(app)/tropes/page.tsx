import { prisma } from "@/lib/prisma";
import TropeList from "@/components/TropeList";

export default async function TropesPage() {
  const tropes = await prisma.trope.findMany({
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  return (
    <TropeList
      tropes={tropes.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        content: t.content,
        notes: t.notes,
      }))}
    />
  );
}
