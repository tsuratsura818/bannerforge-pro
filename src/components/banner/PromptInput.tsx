"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { buildBannerPrompt } from "@/lib/prompts/banner";
import type { BannerStyle } from "@/types/generation";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  style: BannerStyle;
}

const EXAMPLES = [
  "夏のセール 最大50%OFF 期間限定",
  "新商品登場！プレミアムコーヒー",
  "週末限定キャンペーン 今すぐチェック",
];

export function PromptInput({ value, onChange, style }: PromptInputProps) {
  const [catchcopy, setCatchcopy] = useState("");
  const [subText, setSubText] = useState("");
  const [mode, setMode] = useState<"simple" | "advanced">("simple");

  const applyBuilderPrompt = () => {
    if (!catchcopy) return;
    const built = buildBannerPrompt({ catchcopy, subText, style });
    onChange(built);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => setMode("simple")}
          className={`px-3 py-1 rounded-full transition ${mode === "simple" ? "bg-[#1A1A2E] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
        >
          シンプル
        </button>
        <button
          onClick={() => setMode("advanced")}
          className={`px-3 py-1 rounded-full transition ${mode === "advanced" ? "bg-[#1A1A2E] text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
        >
          詳細設定
        </button>
      </div>

      {mode === "simple" ? (
        <div className="space-y-2">
          <input
            type="text"
            value={catchcopy}
            onChange={(e) => setCatchcopy(e.target.value)}
            placeholder="キャッチコピー（例: 夏のセール 最大50%OFF）"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
          <input
            type="text"
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="サブテキスト（オプション）"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
          <button
            onClick={applyBuilderPrompt}
            className="flex items-center gap-1.5 text-xs text-[#1A1A2E] dark:text-blue-400 hover:underline"
          >
            <Sparkles className="w-3.5 h-3.5" />
            プロンプトを自動生成
          </button>
          <div className="flex flex-wrap gap-1 mt-1">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setCatchcopy(ex)}
                className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="バナーの詳細な指示を入力してください..."
          rows={6}
          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm resize-none"
        />
      )}
    </div>
  );
}
