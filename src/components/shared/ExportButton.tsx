"use client";

import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Loader2 } from "lucide-react";

type ExportFormat = "png" | "jpeg" | "webp" | "svg" | "pdf" | "psd";

const FORMAT_OPTIONS: { value: ExportFormat; label: string; desc: string }[] = [
  { value: "png",  label: "PNG",  desc: "透過対応・高品質" },
  { value: "jpeg", label: "JPEG", desc: "写真向け・軽量" },
  { value: "webp", label: "WebP", desc: "Web最適化" },
  { value: "svg",  label: "SVG",  desc: "Figma / Illustrator で開く" },
  { value: "pdf",  label: "PDF",  desc: "印刷・Illustrator対応" },
  { value: "psd",  label: "PSD",  desc: "Photoshop レイヤー付き" },
];

interface ExportButtonProps {
  imageUrl: string;
  basename?: string;
}

export function ExportButton({ imageUrl, basename = "bannerforge" }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<ExportFormat | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // 外側クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setOpen(false);
    setLoading(format);
    try {
      const res = await fetch("/api/export/format", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "エクスポートに失敗しました");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${basename}.${format === "jpeg" ? "jpg" : format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エクスポートに失敗しました");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div ref={ref} className="relative">
      <div className="flex">
        {/* メインボタン：PNG即時DL */}
        <button
          onClick={() => handleExport("png")}
          disabled={!!loading}
          className="flex items-center gap-2 px-3 py-2 bg-[#1A1A2E] text-white rounded-l-lg hover:bg-[#2d2d52] disabled:opacity-50 transition text-sm font-medium"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {loading ? `${loading.toUpperCase()} 変換中...` : "ダウンロード"}
        </button>

        {/* 形式選択ドロップダウン */}
        <button
          onClick={() => setOpen((v) => !v)}
          disabled={!!loading}
          className="flex items-center px-2 py-2 bg-[#2d2d52] text-white rounded-r-lg hover:bg-[#3d3d72] disabled:opacity-50 transition border-l border-white/10"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      {open && (
        <div className="absolute left-0 bottom-full mb-2 w-52 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50">
          <p className="px-3 py-2 text-xs text-white/40 font-medium uppercase tracking-wide border-b border-white/10">
            形式を選択
          </p>
          {FORMAT_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              onClick={() => handleExport(value)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition text-left"
            >
              <span className="font-semibold text-white text-sm">{label}</span>
              <span className="text-xs text-white/40">{desc}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
