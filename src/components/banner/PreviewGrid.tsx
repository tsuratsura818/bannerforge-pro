"use client";

import { ImagePreview } from "@/components/shared/ImagePreview";
import { ExportButton } from "@/components/shared/ExportButton";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RefreshCw, Heart } from "lucide-react";

interface PreviewGridProps {
  images: string[];
  isLoading: boolean;
  onRegenerate?: () => void;
}

export function PreviewGrid({ images, isLoading, onRegenerate }: PreviewGridProps) {
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
        <LoadingSpinner text="AIが画像を生成中... (3〜15秒かかります)" />
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
    <div className="flex-1 flex flex-col gap-4">
      {images.map((url, i) => (
        <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
          <div className="relative aspect-square">
            <ImagePreview src={url} alt={`Generated image ${i + 1}`} className="w-full h-full" />
          </div>
          <div className="flex items-center gap-2 p-3 border-t border-gray-200 dark:border-gray-800">
            <ExportButton imageUrl={url} basename={`bannerforge-${i + 1}`} />
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
  );
}
