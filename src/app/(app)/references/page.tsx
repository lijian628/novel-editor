import { prisma } from "@/lib/prisma";
import ReferenceList from "@/components/ReferenceList";

export default async function ReferencesPage() {
  const references = await prisma.reference.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <ReferenceList
      references={references.map((r) => ({
        id: r.id,
        category: r.category,
        content: r.content,
      }))}
    />
  );
}
