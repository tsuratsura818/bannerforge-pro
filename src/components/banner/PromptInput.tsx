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

const INPUT_BASE = "w-full px-3 py-2.5 rounded-lg bg-white/8 border border-white/15 text-white text-sm placeholder-white/30 focus:outline-none focus:border-white/40 focus:bg-white/10 transition";

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
      <div className="flex gap-1 p-1 bg-white/5 rounded-lg">
        <button
          onClick={() => setMode("simple")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
            mode === "simple"
              ? "bg-white text-[#1A1A2E]"
              : "text-white/50 hover:text-white"
          }`}
        >
          シンプル
        </button>
        <button
          onClick={() => setMode("advanced")}
          className={`flex-1 py-1.5 text-sm font-medium rounded-md transition ${
            mode === "advanced"
              ? "bg-white text-[#1A1A2E]"
              : "text-white/50 hover:text-white"
          }`}
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
            className={INPUT_BASE}
          />
          <input
            type="text"
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="サブテキスト（オプション）"
            className={INPUT_BASE}
          />
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setCatchcopy(ex)}
                  className="text-xs px-2 py-0.5 bg-white/8 border border-white/10 text-white/50 rounded hover:bg-white/15 hover:text-white/80 transition"
                >
                  {ex}
                </button>
              ))}
            </div>
            <button
              onClick={applyBuilderPrompt}
              disabled={!catchcopy}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-30 transition shrink-0 ml-2"
            >
              <Sparkles className="w-3 h-3" />
              生成
            </button>
          </div>

          {/* プレビュー */}
          {value && (
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs text-white/40 mb-1">生成されたプロンプト</p>
              <p className="text-xs text-white/70 leading-relaxed line-clamp-4">{value}</p>
            </div>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="バナーの詳細な指示を入力してください..."
          rows={7}
          className={`${INPUT_BASE} resize-none`}
        />
      )}
    </div>
  );
}
