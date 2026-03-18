"use client";

import { useState } from "react";
import { ImageUploader } from "./ImageUploader";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { DownloadButton } from "@/components/shared/DownloadButton";
import Image from "next/image";

interface CropParams {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function CropTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [resultUrl, setResultUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [cropParams, setCropParams] = useState<CropParams>({ x: 0, y: 0, width: 100, height: 100 });
  const [error, setError] = useState("");

  const handleUpload = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResultUrl("");
  };

  const handleCrop = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("x", String(cropParams.x));
      formData.append("y", String(cropParams.y));
      formData.append("width", String(cropParams.width));
      formData.append("height", String(cropParams.height));

      const res = await fetch("/api/edit/crop", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "クロップに失敗しました");
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
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">元の画像</h3>
          <ImageUploader
            onUpload={handleUpload}
            preview={preview}
            onClear={() => { setFile(null); setPreview(""); setResultUrl(""); }}
          />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">クロップ結果</h3>
          {loading ? (
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center">
              <LoadingSpinner text="クロップ中..." />
            </div>
          ) : resultUrl ? (
            <div className="space-y-3">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <Image src={resultUrl} alt="Cropped" fill className="object-contain" sizes="50vw" />
              </div>
              <DownloadButton imageUrl={resultUrl} filename="cropped-image.png" />
            </div>
          ) : (
            <div className="aspect-square bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
              <p className="text-sm text-gray-400">クロップ後の画像がここに表示されます</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(["x", "y", "width", "height"] as (keyof CropParams)[]).map((key) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">{key}</label>
            <input
              type="number"
              value={cropParams[key]}
              onChange={(e) => setCropParams((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
              min={0}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
            />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        onClick={handleCrop}
        disabled={!file || loading}
        className="w-full py-3 bg-[#1A1A2E] text-white rounded-xl font-semibold hover:bg-[#2d2d52] disabled:opacity-50 transition"
      >
        {loading ? "処理中..." : "クロップする"}
      </button>
    </div>
  );
}
