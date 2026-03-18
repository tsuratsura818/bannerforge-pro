"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImagePlus } from "lucide-react";
import Image from "next/image";

interface ReferenceImageUploaderProps {
  files: File[];
  previews: string[];
  onAdd: (file: File, preview: string) => void;
  onRemove: (index: number) => void;
  maxFiles?: number;
}

export function ReferenceImageUploader({
  files,
  previews,
  onAdd,
  onRemove,
  maxFiles = 14,
}: ReferenceImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = maxFiles - files.length;
      acceptedFiles.slice(0, remaining).forEach((file) => {
        const url = URL.createObjectURL(file);
        onAdd(file, url);
      });
    },
    [files.length, maxFiles, onAdd]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles,
    multiple: true,
  });

  const isFull = files.length >= maxFiles;

  return (
    <div className="space-y-3">
      {/* サムネイルグリッド */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group aspect-square">
              <div className="w-full h-full rounded-lg overflow-hidden bg-gray-700 ring-2 ring-white/20">
                <Image
                  src={src}
                  alt={`参照画像 ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
              <button
                onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-center text-white text-[9px] py-0.5 rounded-b-lg opacity-0 group-hover:opacity-100 transition">
                {i + 1}枚目
              </div>
            </div>
          ))}

          {/* 追加ボタン（上限未満の場合） */}
          {!isFull && (
            <div
              {...getRootProps()}
              className={`aspect-square rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition ${
                isDragActive
                  ? "border-blue-400 bg-blue-400/10"
                  : "border-white/20 hover:border-white/40 hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} />
              <ImagePlus className="w-5 h-5 text-white/40" />
            </div>
          )}
        </div>
      )}

      {/* ドロップゾーン（まだ0枚の場合のみ大きく表示） */}
      {previews.length === 0 && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            isDragActive
              ? "border-blue-400 bg-blue-400/10"
              : "border-white/25 hover:border-white/50 hover:bg-white/5"
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="w-8 h-8 text-white/40 mx-auto mb-2" />
          <p className="text-sm text-white/60 font-medium">参照画像をドロップ</p>
          <p className="text-xs text-white/30 mt-0.5">最大{maxFiles}枚 · PNG, JPG, WEBP</p>
        </div>
      )}

      {/* カウント表示 */}
      {files.length > 0 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/50">
            {files.length} / {maxFiles} 枚アップロード済み
          </span>
          <button
            onClick={() => files.forEach((_, i) => onRemove(0))}
            className="text-red-400/70 hover:text-red-400 transition"
          >
            すべて削除
          </button>
        </div>
      )}
    </div>
  );
}
