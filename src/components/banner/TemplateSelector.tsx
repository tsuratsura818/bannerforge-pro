"use client";

import { useState } from "react";
import { BUILT_IN_TEMPLATES } from "@/lib/prompts/templates";
import type { TemplateCategory } from "@/types/template";

const CATEGORIES: { value: TemplateCategory | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "banner", label: "バナー" },
  { value: "social", label: "SNS" },
  { value: "ec", label: "EC" },
  { value: "ad", label: "広告" },
  { value: "event", label: "イベント" },
];

interface TemplateSelectorProps {
  onSelect: (promptTemplate: string, defaultParams: Record<string, unknown>) => void;
  selectedId?: string;
}

export function TemplateSelector({ onSelect, selectedId }: TemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");

  const filtered = BUILT_IN_TEMPLATES.filter(
    (t) => activeCategory === "all" || t.category === activeCategory
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveCategory(value)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
              activeCategory === value
                ? "bg-[#1A1A2E] text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-2">
        {filtered.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.promptTemplate, template.defaultParams)}
            className={`text-left p-3 rounded-lg border transition ${
              selectedId === template.id
                ? "border-[#1A1A2E] bg-[#1A1A2E]/5"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-400"
            }`}
          >
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {template.name}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{template.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
