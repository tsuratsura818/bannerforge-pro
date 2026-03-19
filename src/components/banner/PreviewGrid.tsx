"use client";

import { useState } from "react";
import { ImagePreview } from "@/components/shared/ImagePreview";
import { ExportButton } from "@/components/shared/ExportButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { CompositeEditor } from "@/components/editor/CompositeEditor";
import { RefreshCw, Heart, Layers, Loader2, PenSquare } from "lucide-react";

interface PreviewGridProps {
  images: string[];
  isLoading: boolean;
  productImages?: string[]; // 商品のプレビュー URL (blob: or https:)
  onRegenerate?: () => void;
}

export function PreviewGrid({ images, isLoading, productImages = [], onRegenerate }: PreviewGridProps) {
  const [exportingLayers, setExportingLayers] = useState(false);
  const [editorBg, setEditorBg] = useState<string | null>(null);

  const handleExportAllLayers = async () => {
    setExportingLayers(true);
    try {
      const res = await fetch("/api/export/psd-layers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: images }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "エクスポートに失敗しました");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bannerforge-variations.psd";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エクスポートに失敗しました");
    } finally {
      setExportingLayers(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <LoadingSpinner text="AIが画像を生成中... (30〜60秒かかります)" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-3">🎨</p>
          <p className="font-medium">生成された画像がここに表示されます</p>
          <p className="text-sm mt-1">左のパネルで設定して「生成する」を押してください</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col gap-4">
        {/* バリエーション複数枚：まとめて PSD 保存 */}
        {images.length > 1 && (
          <button
            onClick={handleExportAllLayers}
            disabled={exportingLayers}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#1a1a2e] hover:bg-[#2d2d52] disabled:opacity-50 text-white rounded-xl border border-white/10 text-sm font-medium transition"
          >
            {exportingLayers ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            {exportingLayers ? "PSD 作成中..." : `全 ${images.length} 枚をバリエーションPSDで保存`}
          </button>
        )}

        {images.map((url, i) => (
          <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            <div className="relative aspect-square">
              <ImagePreview src={url} alt={`Generated image ${i + 1}`} className="w-full h-full" />
            </div>
            <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-800 flex-wrap">
              <ExportButton imageUrl={url} basename={`bannerforge-${i + 1}`} />

              {/* レイヤー編集：背景 + 商品 + テキストを自由配置 */}
              <button
                onClick={() => setEditorBg(url)}
                className="flex items-center gap-1.5 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition text-sm"
              >
                <PenSquare className="w-4 h-4" />
                レイヤー編集
              </button>

              <button className="flex items-center gap-1.5 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-red-500 transition text-sm">
                <Heart className="w-4 h-4" />
                お気に入り
              </button>
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-1.5 px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-[#1A1A2E] dark:hover:text-white transition text-sm ml-auto"
                >
                  <RefreshCw className="w-4 h-4" />
                  再生成
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* レイヤーエディタ（フルスクリーンモーダル） */}
      {editorBg && (
        <CompositeEditor
          backgroundUrl={editorBg}
          productImages={productImages}
          onClose={() => setEditorBg(null)}
        />
      )}
    </>
  );
}
