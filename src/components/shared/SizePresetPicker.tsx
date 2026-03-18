"use client";

import { useState } from "react";
import { SIZE_PRESETS, getAllPresets } from "@/lib/presets/sizes";

interface SizePresetPickerProps {
  onSelect: (width: number, height: number, ratio: string) => void;
  selectedRatio?: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram",
  x: "X (Twitter)",
  tiktok: "TikTok",
  youtube: "YouTube",
  facebook: "Facebook",
  line: "LINE",
  amazon: "Amazon",
  rakuten: "楽天",
  zozotown: "ZOZOTOWN",
  shopify: "Shopify",
  base: "BASE",
};

export function SizePresetPicker({ onSelect, selectedRatio }: SizePresetPickerProps) {
  const [activePlatform, setActivePlatform] = useState<string>("instagram");
  const allPresets = getAllPresets();
  const platforms = Object.keys(SIZE_PRESETS);
  const platformPresets = allPresets.filter((p) => p.platform === activePlatform);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {platforms.map((platform) => (
          <button
            key={platform}
            onClick={() => setActivePlatform(platform)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              activePlatform === platform
                ? "bg-[#1A1A2E] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {PLATFORM_LABELS[platform] ?? platform}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {platformPresets.map((preset) => (
          <button
            key={`${preset.platform}-${preset.key}`}
            onClick={() => onSelect(preset.width, preset.height, preset.ratio)}
            className={`p-2 rounded-lg border text-left transition ${
              selectedRatio === preset.ratio
                ? "border-[#1A1A2E] bg-[#1A1A2E]/5 dark:bg-white/5"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
            }`}
          >
            <div className="text-xs font-medium text-gray-900 dark:text-white">
              {preset.label}
            </div>
            <div className="text-xs text-gray-400">
              {preset.width}×{preset.height}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
