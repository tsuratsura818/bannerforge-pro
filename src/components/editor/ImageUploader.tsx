"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface ImageUploaderProps {
  onUpload: (file: File) => void;
  preview?: string;
  onClear?: () => void;
  label?: string;
  accept?: Record<string, string[]>;
}

export function ImageUploader({
  onUpload,
  preview,
  onClear,
  label = "画像をドロップするか、クリックして選択",
  accept = { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
}: ImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles[0]) onUpload(acceptedFiles[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
  });

  if (preview) {
    return (
      <div className="relative">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
          <Image src={preview} alt="Upload preview" fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
        isDragActive
          ? "border-[#1A1A2E] bg-[#1A1A2E]/5"
          : "border-gray-300 dark:border-gray-600 hover:border-[#1A1A2E] hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP</p>
    </div>
  );
}
