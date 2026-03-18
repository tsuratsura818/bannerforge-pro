"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { DownloadButton } from "@/components/shared/DownloadButton";
import { Heart, Trash2, RefreshCw, Filter } from "lucide-react";

interface Generation {
  id: string;
  prompt: string;
  output_images: string[];
  generation_type: string;
  created_at: string;
  is_favorite: boolean;
  aspect_ratio?: string;
  resolution?: string;
}

export default function HistoryPage() {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("type", filterType);
      if (favoritesOnly) params.set("favorites", "true");

      const res = await fetch(`/api/history?${params}`);
      const data = await res.json();
      setGenerations(data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [filterType, favoritesOnly]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleFavorite = async (id: string, currentValue: boolean) => {
    await fetch("/api/history", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_favorite: !currentValue }),
    });
    setGenerations((prev) =>
      prev.map((g) => (g.id === id ? { ...g, is_favorite: !currentValue } : g))
    );
  };

  const deleteGeneration = async (id: string) => {
    if (!confirm("この画像を削除しますか？")) return;
    await fetch("/api/history", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  };

  const TYPE_LABELS: Record<string, string> = {
    generate: "生成",
    edit: "編集",
    "remove-bg": "背景除去",
    "replace-bg": "背景差替",
    crop: "切り抜き",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">生成履歴</h1>
          <p className="text-gray-500 mt-1">過去に生成・編集した画像の一覧</p>
        </div>
        <button onClick={fetchHistory} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* フィルター */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {["", "generate", "remove-bg", "replace-bg", "crop"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                filterType === type
                  ? "bg-[#1A1A2E] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
              }`}
            >
              {type === "" ? "すべて" : TYPE_LABELS[type] ?? type}
            </button>
          ))}
          <button
            onClick={() => setFavoritesOnly(!favoritesOnly)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition ${
              favoritesOnly
                ? "bg-red-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            お気に入りのみ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : generations.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p>履歴がありません</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {generations.map((gen) => (
            <div key={gen.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
              {gen.output_images?.[0] && (
                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                  <Image
                    src={gen.output_images[0]}
                    alt="Generated"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                    {TYPE_LABELS[gen.generation_type] ?? gen.generation_type}
                  </span>
                </div>
              )}
              <div className="p-3 space-y-2">
                <p className="text-xs text-gray-500 truncate">{gen.prompt}</p>
                <p className="text-xs text-gray-400">
                  {new Date(gen.created_at).toLocaleDateString("ja-JP")}
                </p>
                <div className="flex items-center gap-1.5">
                  {gen.output_images?.[0] && (
                    <DownloadButton imageUrl={gen.output_images[0]} filename={`gen-${gen.id}.png`} className="flex-1 justify-center text-xs py-1.5" />
                  )}
                  <button
                    onClick={() => toggleFavorite(gen.id, gen.is_favorite)}
                    className={`p-1.5 rounded-lg transition ${gen.is_favorite ? "text-red-500" : "text-gray-400 hover:text-red-400"}`}
                  >
                    <Heart className="w-4 h-4" fill={gen.is_favorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={() => deleteGeneration(gen.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
