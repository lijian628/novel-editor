"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CodeMirror, { type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { countWords } from "@/lib/wordcount";
import { stripMarkdown } from "@/lib/markdown";

type Story = {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
};

const MARKER_TYPES = ["打脸", "反转", "身份揭晓", "钩子", "悬念", "爽点"];

export default function StoryEditor({ story }: { story: Story }) {
  const router = useRouter();
  const [title, setTitle] = useState(story.title);
  const [content, setContent] = useState(story.content);
  const [showPreview, setShowPreview] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<
    { id: string; createdAt: string; content: string }[]
  >([]);

  const wordCount = useMemo(() => countWords(content), [content]);
  const [previewText, setPreviewText] = useState(story.content);
  const skippedFirst = useRef(false);
  const contentRef = useRef(content);
  const lastSnapshotRef = useRef(story.content);
  const cmRef = useRef<ReactCodeMirrorRef>(null);
  const [markerOpen, setMarkerOpen] = useState(false);
  const [markers, setMarkers] = useState<
    { id: string; type: string; position: number; note: string | null }[]
  >([]);
  const [markerType, setMarkerType] = useState("爽点");
  const [markerNote, setMarkerNote] = useState("");
  const [aiOpen, setAiOpen] = useState(false);
  const [aiBusy, setAiBusy] = useState<null | "continue" | "polish">(null);
  const [aiError, setAiError] = useState("");

  // 自动保存：标题/正文变化后 1.2s 无操作则 PATCH
  useEffect(() => {
    if (!skippedFirst.current) {
      skippedFirst.current = true;
      return;
    }
    setSaveState("saving");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stories/${story.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content, wordCount }),
        });
        setSaveState(res.ok ? "saved" : "idle");
      } catch {
        setSaveState("idle");
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, [title, content, wordCount, story.id]);

  // 预览防抖：避免每个字都触发 Markdown 重渲染
  useEffect(() => {
    const t = setTimeout(() => setPreviewText(content), 300);
    return () => clearTimeout(t);
  }, [content]);

  // 保持 contentRef 为最新内容（供定时快照读取）
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // 每 5 分钟自动存一次快照（内容有变化才存）
  useEffect(() => {
    const interval = setInterval(async () => {
      if (contentRef.current !== lastSnapshotRef.current) {
        try {
          await fetch(`/api/stories/${story.id}/snapshots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: contentRef.current }),
          });
          lastSnapshotRef.current = contentRef.current;
        } catch {
          // 忽略快照失败
        }
      }
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [story.id]);

  async function handleDelete() {
    if (!window.confirm("确定删除这篇？删除后不可恢复。")) return;
    setDeleting(true);
    await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  function downloadFile(filename: string, text: string, mime: string) {
    const blob = new Blob([text], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function exportMd() {
    downloadFile(`${title || "未命名"}.md`, content, "text/markdown");
  }

  function exportTxt() {
    downloadFile(
      `${title || "未命名"}.txt`,
      stripMarkdown(content),
      "text/plain",
    );
  }

  async function loadSnapshots() {
    try {
      const res = await fetch(`/api/stories/${story.id}/snapshots`);
      if (res.ok) {
        const data = await res.json();
        setSnapshots(data.snapshots ?? []);
      }
    } catch {
      // 忽略
    }
  }

  async function manualSnapshot() {
    try {
      await fetch(`/api/stories/${story.id}/snapshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      lastSnapshotRef.current = content;
      await loadSnapshots();
    } catch {
      // 忽略
    }
  }

  function openHistory() {
    setHistoryOpen(true);
    loadSnapshots();
  }

  function restoreSnapshot(snapContent: string) {
    if (!window.confirm("恢复此版本？当前内容会被覆盖。")) return;
    setContent(snapContent);
    setHistoryOpen(false);
  }

  async function loadMarkers() {
    try {
      const res = await fetch(`/api/stories/${story.id}/markers`);
      if (res.ok) {
        const data = await res.json();
        setMarkers(data.markers ?? []);
      }
    } catch {
      // 忽略
    }
  }

  async function addMarker() {
    try {
      const position =
        cmRef.current?.view?.state.selection.main.head ?? content.length;
      await fetch(`/api/stories/${story.id}/markers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: markerType,
          position,
          note: markerNote.trim() || null,
        }),
      });
      setMarkerNote("");
      await loadMarkers();
    } catch {
      // 忽略
    }
  }

  async function deleteMarker(markerId: string) {
    try {
      await fetch(`/api/stories/${story.id}/markers/${markerId}`, {
        method: "DELETE",
      });
      await loadMarkers();
    } catch {
      // 忽略
    }
  }

  function openMarkers() {
    setMarkerOpen(true);
    loadMarkers();
  }

  async function aiContinue() {
    setAiError("");
    setAiBusy("continue");
    try {
      const res = await fetch("/api/ai/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary: story.summary,
          context: content.slice(-2000),
        }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setContent((prev) => prev + (prev.trim() ? "\n\n" : "") + data.text);
      } else {
        setAiError(data.error ?? "续写失败");
      }
    } catch {
      setAiError("续写失败");
    } finally {
      setAiBusy(null);
    }
  }

  async function aiPolish(mode: string) {
    const sel = cmRef.current?.view?.state.selection.main;
    if (!sel || sel.empty) {
      setAiError("请先选中要处理的文字");
      return;
    }
    const selectedText = content.slice(sel.from, sel.to);
    if (!selectedText.trim()) {
      setAiError("选中内容为空");
      return;
    }
    setAiError("");
    setAiBusy("polish");
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: selectedText, mode }),
      });
      const data = await res.json();
      if (res.ok && data.text) {
        setContent(
          (prev) => prev.slice(0, sel.from) + data.text + prev.slice(sel.to),
        );
      } else {
        setAiError(data.error ?? "处理失败");
      }
    } catch {
      setAiError("处理失败");
    } finally {
      setAiBusy(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-zinc-800 px-4 py-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="标题"
          className="min-w-0 flex-1 bg-transparent text-lg font-semibold text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <span className="shrink-0 text-sm text-zinc-500">{wordCount} 字</span>
        <span className="shrink-0 w-14 text-xs text-zinc-600">
          {saveState === "saving"
            ? "保存中…"
            : saveState === "saved"
              ? "已保存"
              : ""}
        </span>
        {aiError && (
          <span className="shrink-0 max-w-40 truncate text-xs text-red-400">
            {aiError}
          </span>
        )}
        <button
          onClick={() => setShowPreview((v) => !v)}
          className="shrink-0 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          {showPreview ? "沉浸" : "分屏"}
        </button>

        <div className="relative shrink-0">
          <button
            onClick={() => setAiOpen((v) => !v)}
            disabled={aiBusy !== null}
            className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 disabled:opacity-50"
          >
            {aiBusy ? "AI 中…" : "AI ▾"}
          </button>
          {aiOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg">
              <button
                onClick={() => {
                  setAiOpen(false);
                  aiContinue();
                }}
                className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                续写
              </button>
              <button
                onClick={() => {
                  setAiOpen(false);
                  aiPolish("润色");
                }}
                className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                润色（选中）
              </button>
              <button
                onClick={() => {
                  setAiOpen(false);
                  aiPolish("纠错");
                }}
                className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                纠错（选中）
              </button>
              <button
                onClick={() => {
                  setAiOpen(false);
                  aiPolish("扩写");
                }}
                className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                扩写（选中）
              </button>
              <button
                onClick={() => {
                  setAiOpen(false);
                  aiPolish("精简");
                }}
                className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                精简（选中）
              </button>
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          <button
            onClick={() => setExportOpen((v) => !v)}
            className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
          >
            导出 ▾
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-lg">
              <button
                onClick={() => {
                  exportMd();
                  setExportOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                Markdown (.md)
              </button>
              <button
                onClick={() => {
                  exportTxt();
                  setExportOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800"
              >
                纯文本 (.txt)
              </button>
            </div>
          )}
        </div>

        <button
          onClick={openHistory}
          className="shrink-0 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          历史
        </button>

        <button
          onClick={openMarkers}
          className="shrink-0 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200"
        >
          爽点
        </button>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="shrink-0 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs text-red-400 transition-colors hover:bg-red-950/40 disabled:opacity-50"
        >
          删除
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div
          className={`${
            showPreview ? "w-1/2" : "flex-1"
          } min-w-0 border-r border-zinc-800`}
        >
          <CodeMirror
            ref={cmRef}
            value={content}
            onChange={(value) => setContent(value)}
            extensions={[markdown(), oneDark, EditorView.lineWrapping]}
            height="100%"
            style={{ height: "100%", fontSize: "15px" }}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
            }}
            placeholder="开始写你的爽文…"
          />
        </div>
        {showPreview && (
          <div className="w-1/2 min-w-0 overflow-y-auto bg-zinc-950 px-8 py-6">
            <article className="prose prose-invert prose-zinc max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {previewText || "写点什么，右侧实时预览。"}
              </ReactMarkdown>
            </article>
          </div>
        )}
      </div>

      {historyOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50"
          onClick={() => setHistoryOpen(false)}
        >
          <div
            className="max-h-[80vh] w-96 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">版本历史</h3>
              <button
                onClick={() => setHistoryOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <button
              onClick={manualSnapshot}
              className="mb-3 w-full rounded-lg bg-zinc-800 py-2 text-xs text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              ＋ 立即保存当前快照
            </button>

            {snapshots.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-600">
                暂无快照。编辑时会每 5 分钟自动存一次。
              </p>
            ) : (
              <ul className="space-y-2">
                {snapshots.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        {new Date(s.createdAt).toLocaleString("zh-CN")}
                      </span>
                      <span className="text-xs text-zinc-600">
                        {countWords(s.content)} 字
                      </span>
                    </div>
                    <p className="mb-2 truncate text-xs text-zinc-600">
                      {s.content.slice(0, 60) || "（空）"}
                    </p>
                    <button
                      onClick={() => restoreSnapshot(s.content)}
                      className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                    >
                      恢复此版本
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {markerOpen && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-black/50"
          onClick={() => setMarkerOpen(false)}
        >
          <div
            className="max-h-[80vh] w-96 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-100">爽点标记</h3>
              <button
                onClick={() => setMarkerOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            <div className="mb-3 flex gap-2">
              <select
                value={markerType}
                onChange={(e) => setMarkerType(e.target.value)}
                className="rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 outline-none"
              >
                {MARKER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <input
                value={markerNote}
                onChange={(e) => setMarkerNote(e.target.value)}
                placeholder="备注（可选）"
                className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <button
                onClick={addMarker}
                className="shrink-0 rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-700"
              >
                添加
              </button>
            </div>

            {markers.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-600">
                还没有标记。点「添加」在当前光标处打个爽点。
              </p>
            ) : (
              <ul className="space-y-1.5">
                {markers.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <span className="mr-2 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-amber-300/90">
                        {m.type}
                      </span>
                      <span className="text-xs text-zinc-500">
                        第 {m.position} 字
                      </span>
                      {m.note && (
                        <span className="ml-2 text-xs text-zinc-400">
                          {m.note}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => deleteMarker(m.id)}
                      className="shrink-0 text-xs text-zinc-600 hover:text-red-400"
                    >
                      删
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
