"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import LogoutButton from "./LogoutButton";

type StoryItem = {
  id: string;
  title: string;
  wordCount: number;
  status: string;
};

const statusLabel: Record<string, string> = {
  draft: "草稿",
  finished: "已完成",
  published: "已发布",
};

export default function Sidebar({ stories }: { stories: StoryItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [creating, setCreating] = useState(false);

  async function createStory() {
    setCreating(true);
    try {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "未命名" }),
      });
      if (res.ok) {
        const story = await res.json();
        router.push(`/stories/${story.id}`);
        router.refresh();
      }
    } finally {
      setCreating(false);
    }
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/50">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-semibold text-zinc-200">我的短篇</span>
        <LogoutButton />
      </div>

      <div className="space-y-2 p-3">
        <Link
          href="/generate"
          className={`block rounded-lg bg-zinc-800 py-2 text-center text-sm font-medium text-zinc-100 transition-colors hover:bg-zinc-700 ${
            pathname === "/generate" ? "ring-1 ring-zinc-500" : ""
          }`}
        >
          ✨ AI 成稿
        </Link>
        <button
          onClick={createStory}
          disabled={creating}
          className="w-full rounded-lg bg-zinc-100 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
        >
          {creating ? "创建中…" : "＋ 新建一篇"}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {stories.length === 0 ? (
          <p className="px-2 py-4 text-sm text-zinc-600">
            还没有作品，点上面新建一篇。
          </p>
        ) : (
          <ul className="space-y-0.5">
            {stories.map((s) => {
              const active = pathname === `/stories/${s.id}`;
              return (
                <li key={s.id}>
                  <Link
                    href={`/stories/${s.id}`}
                    className={`block rounded-lg px-3 py-2 transition-colors ${
                      active
                        ? "bg-zinc-800 text-zinc-100"
                        : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
                    }`}
                  >
                    <div className="truncate text-sm">{s.title}</div>
                    <div className="mt-0.5 text-xs text-zinc-600">
                      {s.wordCount} 字 · {statusLabel[s.status] ?? s.status}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      <div className="space-y-1 border-t border-zinc-800 p-2">
        <Link
          href="/tropes"
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/tropes"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
          }`}
        >
          钩子库
        </Link>
        <Link
          href="/settings"
          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/settings"
              ? "bg-zinc-800 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
          }`}
        >
          AI 设置
        </Link>
      </div>
    </aside>
  );
}
