"use client";

import type { BannerStyle, AspectRatio, Resolution } from "@/types/generation";

const STYLES: { value: BannerStyle; label: string }[] = [
  { value: "simple", label: "シンプル" },
  { value: "pop", label: "ポップ" },
  { value: "luxury", label: "ラグジュアリー" },
  { value: "japanese", label: "和風" },
  { value: "neon", label: "ネオン" },
  { value: "minimal", label: "ミニマル" },
  { value: "corporate", label: "ビジネス" },
];

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "1:1" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "4:5", label: "4:5" },
];

const RESOLUTIONS: { value: Resolution; label: string; desc: string }[] = [
  { value: "512", label: "プレビュー", desc: "512px" },
  { value: "1K", label: "標準", desc: "1K" },
  { value: "2K", label: "高解像度", desc: "2K" },
  { value: "4K", label: "超高解像度", desc: "4K" },
];

interface ParamsPanelProps {
  style: BannerStyle;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  onStyleChange: (style: BannerStyle) => void;
  onAspectRatioChange: (ratio: AspectRatio) => void;
  onResolutionChange: (resolution: Resolution) => void;
}

export function ParamsPanel({
  style,
  aspectRatio,
  resolution,
  onStyleChange,
  onAspectRatioChange,
  onResolutionChange,
}: ParamsPanelProps) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
          スタイル
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onStyleChange(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition text-center border ${
                style === value
                  ? "bg-white text-[#1A1A2E] border-white"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
          アスペクト比
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_RATIOS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onAspectRatioChange(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition border ${
                aspectRatio === value
                  ? "bg-white text-[#1A1A2E] border-white"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
          解像度
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {RESOLUTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => onResolutionChange(value)}
              className={`px-3 py-2 rounded-lg text-sm transition border text-left ${
                resolution === value
                  ? "bg-white text-[#1A1A2E] border-white"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span className="font-medium">{label}</span>
              <span className={`ml-1.5 text-xs ${resolution === value ? "text-[#1A1A2E]/60" : "text-white/30"}`}>
                {desc}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
