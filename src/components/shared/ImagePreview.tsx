"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import Image from "next/image";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({ src, alt = "Generated image", className }: ImagePreviewProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className={`relative group cursor-pointer ${className}`} onClick={() => setModalOpen(true)}>
        <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 768px) 100vw, 50vw" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition" />
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
            onClick={() => setModalOpen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <div className="relative max-w-4xl max-h-full w-full h-full">
            <Image src={src} alt={alt} fill className="object-contain" sizes="100vw" />
          </div>
        </div>
      )}
    </>
  );
}
