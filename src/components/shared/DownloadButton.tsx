"use client";

import { Download } from "lucide-react";

interface DownloadButtonProps {
  imageUrl: string;
  filename?: string;
  className?: string;
}

export function DownloadButton({
  imageUrl,
  filename = "bannerforge-image.png",
  className,
}: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // フォールバック
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = filename;
      a.target = "_blank";
      a.click();
    }
  };

  return (
    <button
      onClick={handleDownload}
      className={`flex items-center gap-2 px-4 py-2 bg-[#1A1A2E] text-white rounded-lg hover:bg-[#2d2d52] transition text-sm font-medium ${className}`}
    >
      <Download className="w-4 h-4" />
      ダウンロード
    </button>
  );
}
