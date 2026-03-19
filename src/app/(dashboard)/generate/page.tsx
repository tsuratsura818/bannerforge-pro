"use client";

import { useState, useCallback } from "react";
import { TemplateSelector } from "@/components/banner/TemplateSelector";
import { PromptInput } from "@/components/banner/PromptInput";
import { ParamsPanel } from "@/components/banner/ParamsPanel";
import { PreviewGrid } from "@/components/banner/PreviewGrid";
import { ReferenceImageUploader } from "@/components/editor/ReferenceImageUploader";
import { CompositeEditor } from "@/components/editor/CompositeEditor";
import { Wand2, ChevronDown, ChevronUp, Layers } from "lucide-react";
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

  // レイヤーモード：商品を合成せず背景のみ生成してエディタで配置
  const [layerMode, setLayerMode] = useState(false);
  const [editorBg, setEditorBg] = useState<string | null>(null);

  // 画像をCanvas経由で圧縮（最大800px、JPEG 80%）
  const compressImage = useCallback((file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          const scale = MAX / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", 0.8);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      setError("プロンプトを入力してください");
      return;
    }
    setIsGenerating(true);
    setGeneratedImages([]);
    setError("");

    try {
      const formData = new FormData();
      formData.append("prompt", prompt);
      formData.append("aspectRatio", aspectRatio);
      formData.append("resolution", resolution);
      formData.append("style", style);

      // レイヤーモードのときは商品画像を送らない（背景のみ生成）
      if (!layerMode) {
        for (let i = 0; i < referenceFiles.length; i++) {
          const compressed = await compressImage(referenceFiles[i]);
          formData.append("productImages", compressed, `product_${i}.jpg`);
        }
      }

      const res = await fetch("/api/generate/banner", {
        method: "POST",
        body: formData,
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          res.status === 413
            ? "画像サイズが大きすぎます。枚数を減らしてください。"
            : `サーバーエラー (${res.status})`
        );
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");

      const images: string[] = data.images ?? [];
      setGeneratedImages(images);

      // レイヤーモードは最初の画像を背景としてエディタを自動オープン
      if (layerMode && images.length > 0) {
        setEditorBg(images[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, aspectRatio, resolution, style, referenceFiles, compressImage, layerMode]);

  return (
    <>
      <div className="h-full flex flex-col gap-6">
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

            {/* 商品画像 */}
            <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-white text-sm">
                  商品画像
                  <span className="ml-2 text-xs font-normal text-white/40">オプション</span>
                </h3>
                <p className="text-xs text-white/30 mt-1">
                  {layerMode
                    ? "アップした商品をレイヤーとしてエディタに配置します（AIは背景のみ生成）"
                    : "アップした商品をバナーの中に自然に配置して生成します"}
                </p>
              </div>
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

            {/* レイヤーモードトグル */}
            <div
              onClick={() => setLayerMode(v => !v)}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition select-none ${
                layerMode
                  ? "bg-indigo-900/30 border-indigo-500/50"
                  : "bg-[#0f0f1e] border-white/10 hover:border-white/20"
              }`}
            >
              <Layers className={`w-5 h-5 shrink-0 ${layerMode ? "text-indigo-400" : "text-white/40"}`} />
              <div className="flex-1">
                <p className={`text-sm font-semibold ${layerMode ? "text-indigo-300" : "text-white/70"}`}>
                  レイヤーモードで生成
                </p>
                <p className="text-xs text-white/30 mt-0.5">
                  AIが背景を生成 → 商品・テキストをブラウザで自由に配置してPSD書き出し
                </p>
              </div>
              <div className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${layerMode ? "bg-indigo-600" : "bg-white/20"}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${layerMode ? "translate-x-4" : ""}`} />
              </div>
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
              {isGenerating ? "AI が生成中... (30〜60秒)" : layerMode ? "背景を生成してエディタを開く" : "画像を生成する"}
            </button>
          </div>

          {/* 右カラム: プレビュー */}
          <div className="flex flex-col min-h-0">
            <PreviewGrid
              images={generatedImages}
              isLoading={isGenerating}
              productImages={referencePreviews}
              onRegenerate={handleGenerate}
            />
          </div>
        </div>
      </div>

      {/* レイヤーエディタ（フルスクリーン） */}
      {editorBg && (
        <CompositeEditor
          backgroundUrl={editorBg}
          productImages={referencePreviews}
          onClose={() => setEditorBg(null)}
        />
      )}
    </>
  );
}
