"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GENRES } from "@/lib/genres";

type Synopsis = { title: string; tags: string[]; summary: string };
type OutlineItem = { title: string; summary: string; hook: string };

const btnPrimary =
  "rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-40";
const textareaCls =
  "w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600";

export default function GenerateWizard() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [genres, setGenres] = useState<string[]>([]);
  const [synopses, setSynopses] = useState<Synopsis[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [generated, setGenerated] = useState("");
  const [busy, setBusy] = useState<null | "synopses" | "outline" | "full">(null);
  const [error, setError] = useState("");

  async function post(url: string, body: unknown) {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  function toggleGenre(id: string) {
    setGenres((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function genSynopses() {
    setBusy("synopses");
    setError("");
    setSynopses([]);
    setSelected(null);
    setOutline([]);
    setGenerated("");
    try {
      const res = await post("/api/ai/synopses", { idea, genres });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");
      setSynopses(data.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function genOutline() {
    if (selected == null) return;
    setBusy("outline");
    setError("");
    setOutline([]);
    setGenerated("");
    try {
      const res = await post("/api/ai/outline", { synopsis: synopses[selected] });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失败");
      setOutline(data.sections ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function genFull() {
    if (selected == null || outline.length === 0) return;
    setBusy("full");
    setError("");
    setGenerated("");
    try {
      const res = await post("/api/ai/generate", {
        synopsis: synopses[selected],
        outline,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "生成失败");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setGenerated(acc);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    } finally {
      setBusy(null);
    }
  }

  async function saveStory() {
    if (selected == null || !generated.trim()) return;
    const synopsis = synopses[selected];
    const res = await post("/api/stories", {
      title: synopsis.title || "未命名",
      summary: synopsis.summary,
      content: generated,
    });
    if (res.ok) {
      const story = await res.json();
      router.push(`/stories/${story.id}`);
      router.refresh();
    } else {
      setError("保存失败");
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="mb-2 text-xl font-semibold text-zinc-100">AI 成稿</h1>
        <p className="mb-6 text-sm text-zinc-500">
          输入一个题目或想法，AI 从梗概一路写到完整短篇。
        </p>

        {/* 第一步：输入想法 */}
        <section className="mb-6">
          <label className="mb-2 block text-sm text-zinc-400">
            题目 / 想法（越具体越好，可以很随意）
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={3}
            placeholder="例如：一个被退婚的穷小子，其实是隐世首富"
            className={textareaCls}
          />

          <div className="mt-3">
            <div className="mb-2 text-sm text-zinc-400">
              风格（可多选，不选则 AI 自由发挥）
            </div>
            {(["女频", "男频", "通用"] as const).map((cat) => (
              <div key={cat} className="mb-2">
                <div className="mb-1 text-xs text-zinc-600">{cat}</div>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.filter((g) => g.category === cat).map((g) => {
                    const active = genres.includes(g.id);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGenre(g.id)}
                        className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                          active
                            ? "border-zinc-500 bg-zinc-700 text-zinc-100"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={genSynopses}
            disabled={!idea.trim() || busy !== null}
            className={`${btnPrimary} mt-3`}
          >
            {busy === "synopses" ? "生成中…" : "生成简介"}
          </button>
        </section>

        {error && (
          <p className="mb-4 rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        {/* 第二步：选简介 */}
        {synopses.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">
              选一个方向（点卡片选中）
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {synopses.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(i)}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    selected === i
                      ? "border-zinc-500 bg-zinc-800/80"
                      : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-700"
                  }`}
                >
                  <div className="mb-1 text-sm font-semibold text-zinc-100">
                    {s.title}
                  </div>
                  {s.tags?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {s.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-400"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-xs leading-relaxed text-zinc-400">
                    {s.summary}
                  </p>
                </button>
              ))}
            </div>
            <button
              onClick={genOutline}
              disabled={selected == null || busy !== null}
              className={`${btnPrimary} mt-3`}
            >
              {busy === "outline" ? "生成中…" : "生成大纲"}
            </button>
          </section>
        )}

        {/* 第三步：大纲 */}
        {outline.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-3 text-sm font-medium text-zinc-300">分节大纲</h2>
            <ol className="space-y-2">
              {outline.map((o, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
                >
                  <div className="text-sm font-medium text-zinc-200">
                    {i + 1}. {o.title}
                    {o.hook && (
                      <span className="ml-2 text-xs text-amber-400/80">
                        【{o.hook}】
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">{o.summary}</p>
                </li>
              ))}
            </ol>
            <button
              onClick={genFull}
              disabled={busy !== null}
              className={`${btnPrimary} mt-3`}
            >
              {busy === "full" ? "正在生成全文…" : "生成完整版"}
            </button>
            <p className="mt-2 text-xs text-zinc-600">
              全文约 {outline.length * 800}~{outline.length * 1000} 字，逐节生成，需要几分钟。
            </p>
          </section>
        )}

        {/* 生成中 */}
        {busy === "full" && (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="mb-2 text-sm text-zinc-300">
              正在生成，可实时看到进度…
            </div>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-4 text-sm leading-relaxed text-zinc-300">
              {generated || "（生成中）"}
            </div>
          </div>
        )}

        {/* 生成完成 */}
        {generated && busy === null && (
          <section className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-medium text-zinc-300">生成完成</h2>
              <button onClick={saveStory} className={btnPrimary}>
                保存到编辑器继续改
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-4 text-sm leading-relaxed text-zinc-300">
              {generated}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
