"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Trope = {
  id: string;
  title: string;
  category: string;
  content: string;
  notes: string | null;
};

const CATEGORIES = ["开头钩子", "打脸", "反转", "身份揭晓", "爽点节奏"];

export default function TropeList({ tropes }: { tropes: Trope[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function addTrope() {
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    await fetch("/api/tropes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        category,
        content: content.trim(),
      }),
    });
    setTitle("");
    setContent("");
    setBusy(false);
    router.refresh();
  }

  async function deleteTrope(id: string) {
    if (!window.confirm("删除这个钩子模板？")) return;
    await fetch(`/api/tropes/${id}`, { method: "DELETE" });
    router.refresh();
  }

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: tropes.filter((t) => t.category === cat),
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-2 text-xl font-semibold text-zinc-100">钩子 / 爽点库</h1>
        <p className="mb-6 text-sm text-zinc-500">
          复用爆款桥段模板，写作时快速套用结构。
        </p>

        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="mb-2 flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="模板标题，如：满级大佬扮猪吃虎"
              className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
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
            rows={2}
            placeholder="模板说明 / 桥段写法"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
          <button
            onClick={addTrope}
            disabled={busy || !title.trim() || !content.trim()}
            className="mt-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-40"
          >
            添加模板
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
                {g.items.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-start justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-zinc-200">
                        {t.title}
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">{t.content}</p>
                    </div>
                    <button
                      onClick={() => deleteTrope(t.id)}
                      className="shrink-0 text-xs text-zinc-600 hover:text-red-400"
                    >
                      删
                    </button>
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
