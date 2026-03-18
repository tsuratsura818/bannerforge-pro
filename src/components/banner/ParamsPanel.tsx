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

const RESOLUTIONS: { value: Resolution; label: string }[] = [
  { value: "512", label: "プレビュー (512px)" },
  { value: "1K", label: "標準 (1K)" },
  { value: "2K", label: "高解像度 (2K)" },
  { value: "4K", label: "超高解像度 (4K)" },
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
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          スタイル
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {STYLES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onStyleChange(value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition text-center ${
                style === value
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          アスペクト比
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ASPECT_RATIOS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onAspectRatioChange(value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition ${
                aspectRatio === value
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          解像度
        </label>
        <div className="space-y-1.5">
          {RESOLUTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onResolutionChange(value)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${
                resolution === value
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
