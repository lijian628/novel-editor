import { prisma } from "@/lib/prisma";

export default async function Home() {
  const [count, agg] = await Promise.all([
    prisma.story.count(),
    prisma.story.aggregate({ _sum: { wordCount: true } }),
  ]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="space-y-2 text-center">
        <p className="text-lg text-zinc-300">短篇爽文编辑器</p>
        <p className="text-sm text-zinc-600">
          共 {count} 篇 · {agg._sum.wordCount ?? 0} 字
        </p>
        <p className="text-sm text-zinc-600">在左侧选择或新建一篇开始写作</p>
      </div>
    </div>
  );
}
