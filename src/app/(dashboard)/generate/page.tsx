"use client";

import { useState, useCallback, useRef } from "react";
import { TemplateSelector } from "@/components/banner/TemplateSelector";
import { PromptInput } from "@/components/banner/PromptInput";
import { ParamsPanel } from "@/components/banner/ParamsPanel";
import { PreviewGrid } from "@/components/banner/PreviewGrid";
import { ReferenceImageUploader } from "@/components/editor/ReferenceImageUploader";
import { Wand2, ChevronDown, ChevronUp } from "lucide-react";
import { ratioToSize, buildPollinationsUrl } from "@/lib/huggingface";
import type { BannerStyle, AspectRatio, Resolution } from "@/types/generation";

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState<BannerStyle>("simple");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("1:1");
  const [resolution, setResolution] = useState<Resolution>("1K");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [referencePreviews, setReferencePreviews] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [error, setError] = useState("");

  // ブラウザが直接ロードする隠し画像のURL
  const [pendingUrl, setPendingUrl] = useState("");
  const pendingUrlRef = useRef("");

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) {
      setError("プロンプトを入力してください");
      return;
    }
    const { width, height } = ratioToSize(aspectRatio, resolution);
    const url = buildPollinationsUrl(prompt, width, height);

    pendingUrlRef.current = url;
    setPendingUrl(url);
    setIsGenerating(true);
    setGeneratedImages([]);
    setError("");
  }, [prompt, aspectRatio, resolution]);

  const handleImageLoad = useCallback(() => {
    const url = pendingUrlRef.current;
    setGeneratedImages([url]);
    setIsGenerating(false);

    // 履歴保存（fire and forget）
    fetch("/api/generate/banner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url, prompt, aspectRatio, resolution, style }),
    }).catch(() => {});
  }, [prompt, aspectRatio, resolution, style]);

  const handleImageError = useCallback(() => {
    setIsGenerating(false);
    setPendingUrl("");
    setError("画像の生成に失敗しました。もう一度お試しください。");
  }, []);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* ブラウザが直接Pollinations.aiから画像をロード（サーバー不要） */}
      {pendingUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pendingUrl}
          alt=""
          className="hidden"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">バナー生成</h1>
        <p className="text-gray-500 mt-1">AIを使ってバナー・商品画像を生成します</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 gap-6 min-h-0">
        {/* 左カラム: 設定パネル */}
        <div className="space-y-3 overflow-y-auto pr-1">
          {/* テンプレート */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 overflow-hidden">
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition"
            >
              <span className="font-semibold text-white text-sm">テンプレート</span>
              {showTemplates ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
            </button>
            {showTemplates && (
              <div className="p-4 border-t border-white/10">
                <TemplateSelector onSelect={(tmpl) => setPrompt(tmpl)} />
              </div>
            )}
          </div>

          {/* プロンプト */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4 space-y-3">
            <h3 className="font-semibold text-white text-sm">プロンプト</h3>
            <PromptInput value={prompt} onChange={setPrompt} style={style} />
          </div>

          {/* パラメーター */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold text-white text-sm mb-4">スタイル・解像度</h3>
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
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4 space-y-3">
            <h3 className="font-semibold text-white text-sm">
              参照画像
              <span className="ml-2 text-xs font-normal text-white/40">オプション</span>
            </h3>
            <ReferenceImageUploader
              files={referenceFiles}
              previews={referencePreviews}
              onAdd={(file, preview) => {
                setReferenceFiles((prev) => [...prev, file].slice(0, 14));
                setReferencePreviews((prev) => [...prev, preview].slice(0, 14));
              }}
              onRemove={(index) => {
                setReferenceFiles((prev) => prev.filter((_, i) => i !== index));
                setReferencePreviews((prev) => {
                  URL.revokeObjectURL(prev[index]);
                  return prev.filter((_, i) => i !== index);
                });
              }}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            <Wand2 className="w-5 h-5" />
            {isGenerating ? "AI が生成中... (30〜60秒)" : "画像を生成する"}
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
