"use client";

import { useState, useCallback } from "react";
import { TemplateSelector } from "@/components/banner/TemplateSelector";
import { PromptInput } from "@/components/banner/PromptInput";
import { ParamsPanel } from "@/components/banner/ParamsPanel";
import { PreviewGrid } from "@/components/banner/PreviewGrid";
import { ImageUploader } from "@/components/editor/ImageUploader";
import { Wand2, ChevronDown, ChevronUp } from "lucide-react";
import type { BannerStyle, AspectRatio, Resolution } from "@/types/generation";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<BannerStyle>("simple");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("プロンプトを入力してください");
      return;
    }
    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate/banner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio, resolution, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      setGeneratedImages(data.images ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, aspectRatio, resolution, style]);

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">バナー生成</h1>
        <p className="text-gray-500 mt-1">AIを使ってバナー・商品画像を生成します</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 gap-6 min-h-0">
        {/* 左カラム: 設定パネル */}
        <div className="space-y-5 overflow-y-auto pr-1">
          {/* テンプレート */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <span className="font-semibold text-gray-900 dark:text-white text-sm">テンプレート</span>
              {showTemplates ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {showTemplates && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <TemplateSelector
                  onSelect={(tmpl) => setPrompt(tmpl)}
                />
              </div>
            )}
          </div>

          {/* プロンプト */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">プロンプト</h3>
            <PromptInput value={prompt} onChange={setPrompt} style={style} />
          </div>

          {/* パラメーター */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-4">スタイル・解像度</h3>
            <ParamsPanel
              style={style}
              aspectRatio={aspectRatio}
              resolution={resolution}
              onStyleChange={setStyle}
              onAspectRatioChange={setAspectRatio}
              onResolutionChange={setResolution}
            />
          </div>

          {/* 参照画像 */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              参照画像（オプション）
            </h3>
            <ImageUploader
              onUpload={(file) => setReferenceFiles((prev) => [...prev, file].slice(0, 14))}
              label="参照画像をドロップ（最大14枚）"
            />
            {referenceFiles.length > 0 && (
              <p className="text-xs text-gray-500">{referenceFiles.length}枚の参照画像</p>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3.5 bg-[#1A1A2E] text-white rounded-xl font-semibold hover:bg-[#2d2d52] disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            <Wand2 className="w-5 h-5" />
            {isGenerating ? "生成中..." : "生成する"}
          </button>
        </div>

        {/* 右カラム: プレビュー */}
        <div className="flex flex-col min-h-0">
          <PreviewGrid
            images={generatedImages}
            isLoading={isGenerating}
            onRegenerate={handleGenerate}
          />
        </div>
      </div>
    </div>
  );
}
