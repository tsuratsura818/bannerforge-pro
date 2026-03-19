"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Trash2, Download, Loader2, Type } from "lucide-react";

interface TextLayer {
  id: string;
  text: string;
  xPct: number;       // 画像幅に対する % (0-100)
  yPct: number;       // 画像高さに対する % (0-100)
  fontSizePct: number; // 画像高さに対する % (1-25)
  color: string;
  fontFamily: string;
  bold: boolean;
  align: "left" | "center" | "right";
}

interface TextEditorProps {
  imageUrl: string;
  onClose: () => void;
}

const FONTS = [
  { value: "sans-serif",    label: "ゴシック体" },
  { value: "serif",         label: "明朝体" },
  { value: "Impact",        label: "Impact" },
  { value: "Arial Black",   label: "Arial Black" },
];

const QUICK_COLORS = [
  "#ffffff", "#000000", "#ff3333", "#ff9900",
  "#ffee00", "#33cc66", "#3399ff", "#cc44cc",
];

const uid = () => Math.random().toString(36).slice(2, 9);

export function TextEditor({ imageUrl, onClose }: TextEditorProps) {
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dispSize, setDispSize] = useState({ w: 0, h: 0 });
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  // 表示サイズを追跡
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      if (imgRef.current) {
        setDispSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
      }
    });
    obs.observe(el);
    if (el.complete) setDispSize({ w: el.offsetWidth, h: el.offsetHeight });
    return () => obs.disconnect();
  }, []);

  const update = (id: string, patch: Partial<TextLayer>) =>
    setLayers(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l));

  const addText = () => {
    const id = uid();
    setLayers(prev => [...prev, {
      id, text: "テキスト",
      xPct: 50, yPct: 50,
      fontSizePct: 7,
      color: "#ffffff",
      fontFamily: "sans-serif",
      bold: true,
      align: "center",
    }]);
    setSelectedId(id);
    setEditingId(id);
  };

  const remove = (id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedId(null);
    setEditingId(null);
  };

  // ドラッグ
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (editingId === id) return;
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const layer = layers.find(l => l.id === id)!;
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, origX: layer.xPct, origY: layer.yPct };
    setSelectedId(id);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    update(dragRef.current.id, {
      xPct: Math.max(0, Math.min(100, dragRef.current.origX + dx)),
      yPct: Math.max(0, Math.min(100, dragRef.current.origY + dy)),
    });
  };

  const onPointerUp = () => { dragRef.current = null; };

  // PNG 書き出し（canvas）
  const handleExport = async () => {
    const img = imgRef.current;
    if (!img) return;
    setExporting(true);
    try {
      await new Promise<void>(r => img.complete ? r() : (img.onload = () => r()));
      const W = img.naturalWidth || img.offsetWidth;
      const H = img.naturalHeight || img.offsetHeight;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, W, H);

      for (const layer of layers) {
        const px = (layer.fontSizePct / 100) * H;
        ctx.save();
        ctx.font = `${layer.bold ? "bold " : ""}${px}px "${layer.fontFamily}"`;
        ctx.fillStyle = layer.color;
        ctx.textAlign = layer.align as CanvasTextAlign;
        ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.55)";
        ctx.shadowBlur = px * 0.12;
        ctx.fillText(layer.text, (layer.xPct / 100) * W, (layer.yPct / 100) * H);
        ctx.restore();
      }

      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "bannerforge-text.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally {
      setExporting(false);
    }
  };

  const sel = layers.find(l => l.id === selectedId);
  const { w: dW, h: dH } = dispSize;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 px-4 h-14 bg-[#0f0f1e] border-b border-white/10 shrink-0">
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition">
          <X className="w-5 h-5 text-white" />
        </button>
        <Type className="w-4 h-4 text-white/40" />
        <span className="text-white font-semibold text-sm">テキスト編集</span>
        <span className="text-white/30 text-xs">ダブルクリックで編集 / ドラッグで移動</span>
        <div className="flex-1" />
        <button
          onClick={addText}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          テキスト追加
        </button>
        <button
          onClick={handleExport}
          disabled={exporting || layers.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {exporting ? "書き出し中..." : "PNG で保存"}
        </button>
      </div>

      {/* ボディ */}
      <div className="flex flex-1 min-h-0">
        {/* キャンバスエリア */}
        <div
          className="flex-1 flex items-center justify-center p-6 overflow-hidden"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => { setSelectedId(null); setEditingId(null); }}
        >
          <div className="relative inline-block">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="banner"
              crossOrigin="anonymous"
              draggable={false}
              className="block max-w-full"
              style={{ maxHeight: "calc(100vh - 200px)" }}
              onLoad={() => {
                if (imgRef.current) {
                  setDispSize({ w: imgRef.current.offsetWidth, h: imgRef.current.offsetHeight });
                }
              }}
            />
            {/* テキストレイヤー */}
            {dW > 0 && layers.map(layer => {
              const fs = (layer.fontSizePct / 100) * dH;
              return (
                <div
                  key={layer.id}
                  style={{
                    position: "absolute",
                    left: (layer.xPct / 100) * dW,
                    top: (layer.yPct / 100) * dH,
                    transform: "translate(-50%, -50%)",
                    fontSize: fs,
                    fontFamily: layer.fontFamily,
                    color: layer.color,
                    fontWeight: layer.bold ? "bold" : "normal",
                    textAlign: layer.align,
                    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                    cursor: editingId === layer.id ? "text" : "grab",
                    outline: selectedId === layer.id ? "2px dashed rgba(99,102,241,0.8)" : "none",
                    outlineOffset: 4,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                    borderRadius: 2,
                  }}
                  onPointerDown={e => onPointerDown(e, layer.id)}
                  onDoubleClick={e => { e.stopPropagation(); setEditingId(layer.id); setSelectedId(layer.id); }}
                  onClick={e => e.stopPropagation()}
                >
                  {editingId === layer.id ? (
                    <input
                      autoFocus
                      value={layer.text}
                      onChange={e => update(layer.id, { text: e.target.value })}
                      onBlur={() => setEditingId(null)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); setEditingId(null); } e.stopPropagation(); }}
                      onClick={e => e.stopPropagation()}
                      style={{
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        font: "inherit",
                        color: "inherit",
                        textAlign: layer.align,
                        width: `${Math.max(layer.text.length + 3, 6) * 0.65}em`,
                        minWidth: "4em",
                      }}
                    />
                  ) : layer.text}
                </div>
              );
            })}

            {/* ヒント */}
            {layers.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-black/50 rounded-xl px-6 py-4 text-center">
                  <Type className="w-8 h-8 text-white/40 mx-auto mb-2" />
                  <p className="text-white/50 text-sm">「テキスト追加」でテキストを追加</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* プロパティパネル */}
        <div className="w-64 bg-[#0f0f1e] border-l border-white/10 flex flex-col">
          {sel ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm font-semibold">プロパティ</span>
                <button
                  onClick={() => remove(sel.id)}
                  className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                  title="削除"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* テキスト */}
              <div className="space-y-1">
                <label className="text-xs text-white/50">テキスト</label>
                <textarea
                  value={sel.text}
                  onChange={e => update(sel.id, { text: e.target.value })}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* フォント */}
              <div className="space-y-1">
                <label className="text-xs text-white/50">フォント</label>
                <select
                  value={sel.fontFamily}
                  onChange={e => update(sel.id, { fontFamily: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* サイズ */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/50">サイズ</label>
                  <span className="text-xs text-white/70">{sel.fontSizePct}%</span>
                </div>
                <input
                  type="range" min={2} max={25} value={sel.fontSizePct}
                  onChange={e => update(sel.id, { fontSizePct: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* カラー */}
              <div className="space-y-1">
                <label className="text-xs text-white/50">カラー</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={sel.color}
                    onChange={e => update(sel.id, { color: e.target.value })}
                    className="w-9 h-9 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0"
                  />
                  <input
                    type="text"
                    value={sel.color}
                    onChange={e => update(sel.id, { color: e.target.value })}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => update(sel.id, { color: c })}
                      style={{ background: c }}
                      className={`w-7 h-7 rounded border hover:scale-110 transition-transform ${sel.color === c ? "border-indigo-400 scale-110" : "border-white/20"}`}
                    />
                  ))}
                </div>
              </div>

              {/* ボールド */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">ボールド</span>
                <button
                  onClick={() => update(sel.id, { bold: !sel.bold })}
                  className={`relative w-10 h-6 rounded-full transition-colors ${sel.bold ? "bg-indigo-600" : "bg-white/20"}`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${sel.bold ? "translate-x-4" : ""}`} />
                </button>
              </div>

              {/* テキスト整列 */}
              <div className="space-y-1">
                <label className="text-xs text-white/50">整列</label>
                <div className="flex gap-1">
                  {(["left", "center", "right"] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => update(sel.id, { align: a })}
                      className={`flex-1 py-1.5 text-xs rounded-lg transition ${sel.align === a ? "bg-indigo-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                    >
                      {a === "left" ? "左" : a === "center" ? "中" : "右"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 text-center">
              <div>
                <Type className="w-8 h-8 text-white/20 mx-auto mb-2" />
                <p className="text-white/30 text-xs">テキストを選択すると<br />プロパティを編集できます</p>
              </div>
            </div>
          )}

          {/* レイヤー一覧 */}
          {layers.length > 0 && (
            <div className="border-t border-white/10 p-3 space-y-1.5">
              <p className="text-xs text-white/40 font-medium">レイヤー</p>
              {[...layers].reverse().map(layer => (
                <button
                  key={layer.id}
                  onClick={() => { setSelectedId(layer.id); setEditingId(null); }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition text-xs ${selectedId === layer.id ? "bg-indigo-600/30 text-white" : "hover:bg-white/5 text-white/60"}`}
                >
                  <Type className="w-3 h-3 shrink-0" />
                  <span className="truncate">{layer.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
