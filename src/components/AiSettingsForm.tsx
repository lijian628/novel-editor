"use client";

import { useState, type FormEvent } from "react";

type Props = {
  initial: {
    baseUrl: string;
    model: string;
    hasApiKey: boolean;
    maskedKey: string | null;
  };
};

const inputCls =
  "mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-zinc-600";

export default function AiSettingsForm({ initial }: Props) {
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [model, setModel] = useState(initial.model);
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(initial.hasApiKey);
  const [maskedKey, setMaskedKey] = useState(initial.maskedKey);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/ai-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, model, apiKey: apiKey || undefined }),
      });
      if (res.ok) {
        setMsg("✓ 已保存");
        if (apiKey.trim()) {
          setHasKey(true);
          const k = apiKey.trim();
          setMaskedKey(k.length > 9 ? `${k.slice(0, 5)}…${k.slice(-4)}` : null);
        }
        setApiKey("");
      } else {
        setMsg("保存失败，请检查填写");
      }
    } catch {
      setMsg("网络错误");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-lg space-y-4">
      <div
        className={`rounded-lg px-3 py-2 text-sm ${
          hasKey
            ? "bg-green-950/40 text-green-300"
            : "bg-amber-950/40 text-amber-300"
        }`}
      >
        {hasKey
          ? `✓ API Key 已配置${maskedKey ? `（${maskedKey}）` : ""}，无需重复填写`
          : "⚠️ 尚未配置 API Key，填写后保存即可"}
      </div>

      <div>
        <label className="text-sm text-zinc-400">API 地址（baseUrl）</label>
        <input
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-sm text-zinc-400">模型名</label>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className={inputCls}
        />
      </div>

      <div>
        <label className="text-sm text-zinc-400">
          API Key{hasKey ? "（已保存，仅更换时填写，留空则保留现有）" : ""}
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={hasKey ? "留空则保持不变" : "sk-..."}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        disabled={saving || !baseUrl || !model}
        className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-white disabled:opacity-50"
      >
        {saving ? "保存中…" : "保存"}
      </button>
      {msg && <p className="text-sm text-zinc-500">{msg}</p>}
    </form>
  );
}
