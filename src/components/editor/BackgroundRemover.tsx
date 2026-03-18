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

  const handleUpload = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResultUrl("");
  };

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("mode", outputMode);
      if (outputMode === "custom") formData.append("background", customBackground);

      const res = await fetch("/api/edit/remove-bg", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "処理に失敗しました");
      setResultUrl(data.imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

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
            onClear={() => { setFile(null); setPreview(""); setResultUrl(""); }}
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            処理後
          </h3>
          {loading ? (
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
              <LoadingSpinner text="背景を除去中..." />
            </div>
          ) : resultUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%3E%3Crect%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%2210%22%20height%3D%2210%22%20fill%3D%22%23ccc%22%2F%3E%3C%2Fsvg%3E')]">
                <Image src={resultUrl} alt="Result" fill className="object-contain" sizes="50vw" />
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

      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
          出力オプション
        </label>
        <div className="flex gap-2">
          {(["transparent", "white", "custom"] as OutputMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setOutputMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                outputMode === mode
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}
            >
              {mode === "transparent" ? "透過PNG" : mode === "white" ? "白背景" : "カスタム背景"}
            </button>
          ))}
        </div>

        {outputMode === "custom" && (
          <input
            type="text"
            value={customBackground}
            onChange={(e) => setCustomBackground(e.target.value)}
            placeholder="背景を説明してください（例: 青空と白い雲）"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleProcess}
        disabled={!file || loading}
        className="w-full py-3 bg-[#1A1A2E] text-white rounded-xl font-semibold hover:bg-[#2d2d52] disabled:opacity-50 transition"
      >
        {loading ? "処理中..." : "背景を除去する"}
      </button>
    </div>
  );
}
