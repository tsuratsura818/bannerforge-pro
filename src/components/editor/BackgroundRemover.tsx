"use client";

import { useState } from "react";
import { ImageUploader } from "./ImageUploader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DownloadButton } from "@/components/shared/DownloadButton";
import Image from "next/image";

type OutputMode = "transparent" | "white" | "custom";

export function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [outputMode, setOutputMode] = useState<OutputMode>("transparent");
  const [customBackground, setCustomBackground] = useState("");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const handleUpload = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResultUrl("");
    setError("");
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    setResultUrl("");
    setProgress("AIモデルを読み込み中...");

    try {
      // ブラウザ内WebAssemblyで処理（API不要・完全無料）
      const { removeBackground } = await import("@imgly/background-removal");

      setProgress("背景を解析中...");
      const blob = await removeBackground(file, {
        publicPath: "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.7/dist/",
        progress: (key: string, current: number, total: number) => {
          if (key.includes("fetch")) {
            const pct = Math.round((current / total) * 100);
            setProgress(`モデルダウンロード中... ${pct}%`);
          }
        },
      });

      setProgress("後処理中...");

      // 出力モードに応じて処理
      if (outputMode === "transparent") {
        const url = URL.createObjectURL(blob);
        setResultUrl(url);
      } else {
        // Canvas で背景を合成
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        const img = document.createElement("img") as HTMLImageElement;
        const imgUrl = URL.createObjectURL(blob);

        await new Promise<void>((resolve) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;

            if (outputMode === "white") {
              ctx.fillStyle = "#FFFFFF";
            } else {
              ctx.fillStyle = customBackground || "#FFFFFF";
            }
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(imgUrl);
            resolve();
          };
          img.src = imgUrl;
        });

        const url = canvas.toDataURL("image/png");
        setResultUrl(url);
      }

      setProgress("");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "処理に失敗しました。別の画像をお試しください。");
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  const OUTPUT_MODES: { value: OutputMode; label: string }[] = [
    { value: "transparent", label: "透過PNG" },
    { value: "white", label: "白背景" },
    { value: "custom", label: "カスタム背景色" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            元の画像
          </h3>
          <ImageUploader
            onUpload={handleUpload}
            preview={preview}
            onClear={() => { setFile(null); setPreview(""); setResultUrl(""); setError(""); }}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            処理後
          </h3>
          {loading ? (
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2">
              <LoadingSpinner text={progress || "処理中..."} />
              <p className="text-xs text-gray-400">初回はモデルのDLで1〜2分かかります</p>
            </div>
          ) : resultUrl ? (
            <div className="space-y-3">
              <div
                className="relative aspect-square rounded-xl overflow-hidden"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Crect width='10' height='10' fill='%23ccc'/%3E%3Crect x='10' y='10' width='10' height='10' fill='%23ccc'/%3E%3C/svg%3E\")",
                }}
              >
                <Image
                  src={resultUrl}
                  alt="Result"
                  fill
                  className="object-contain"
                  sizes="50vw"
                  unoptimized
                />
              </div>
              <DownloadButton imageUrl={resultUrl} filename="removed-bg.png" />
            </div>
          ) : (
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <p className="text-sm text-gray-400">処理後の画像がここに表示されます</p>
            </div>
          )}
        </div>
      </div>

      {/* 出力オプション */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          出力オプション
        </label>
        <div className="flex gap-2 flex-wrap">
          {OUTPUT_MODES.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setOutputMode(value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                outputMode === value
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {outputMode === "custom" && (
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customBackground || "#ffffff"}
              onChange={(e) => setCustomBackground(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
            />
            <input
              type="text"
              value={customBackground}
              onChange={(e) => setCustomBackground(e.target.value)}
              placeholder="#ffffff"
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm w-32"
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleProcess}
          disabled={!file || loading}
          className="flex-1 py-3 bg-[#1A1A2E] text-white rounded-xl font-semibold hover:bg-[#2d2d52] disabled:opacity-50 transition"
        >
          {loading ? "処理中..." : "背景を除去する"}
        </button>
        <p className="text-xs text-gray-400">
          ブラウザ内処理<br />API不要・無料
        </p>
      </div>
    </div>
  );
}
