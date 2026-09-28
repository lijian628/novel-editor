"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Reference = { id: string; category: string; content: string };

const CATEGORIES = ["开头钩子", "打脸", "反转", "对话", "爽点场景"];

export default function ReferenceList({
  references,
}: {
  references: Reference[];
}) {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!content.trim()) return;
    setBusy(true);
    await fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, content: content.trim() }),
    });
    setContent("");
    setBusy(false);
    router.refresh();
  }

  async function del(id: string) {
    if (!window.confirm("删除这段范文？")) return;
    await fetch(`/api/references/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: references.filter((r) => r.category === cat),
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-2 text-xl font-semibold text-zinc-100">范文库</h1>
        <p className="mb-6 text-sm text-zinc-500">
          把你觉得「爽」的段落贴进来，AI 成稿 / 续写时会自动模仿它的文风和节奏。
        </p>

        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-2 text-sm text-zinc-200 outline-none"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            placeholder="贴一段你收藏的爆款段落…"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <button
            onClick={add}
            disabled={busy || !content.trim()}
            className="mt-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
          >
            添加范文
          </button>
        </div>

        {grouped.map((g) => (
          <div key={g.category} className="mb-6">
            <h2 className="mb-2 text-sm font-medium text-zinc-300">
              {g.category}
            </h2>
            {g.items.length === 0 ? (
              <p className="text-xs text-zinc-600">（空）</p>
            ) : (
              <ul className="space-y-2">
                {g.items.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                      {r.content}
                    </p>
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => del(r.id)}
                        className="text-xs text-zinc-600 hover:text-red-400"
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
