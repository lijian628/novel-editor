import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import StoryEditor from "@/components/StoryEditor";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await prisma.story.findUnique({
    where: { id },
    select: { id: true, title: true, content: true, summary: true },
  });

  if (!story) notFound();

  return <StoryEditor story={story} />;
}
