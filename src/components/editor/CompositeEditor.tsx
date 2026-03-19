"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Plus, Trash2, Download, Loader2, Type,
  ImageIcon, FileImage, Eye, EyeOff, ChevronUp, ChevronDown,
} from "lucide-react";

// ────────── Types ──────────

interface BaseLayer {
  id: string;
  name: string;
  visible: boolean;
  xPct: number; // center-x (% of canvas width)
  yPct: number; // center-y (% of canvas height)
}

export interface ImageLayerData extends BaseLayer {
  type: "image";
  src: string;
  wPct: number; // width  (% of canvas width)
  hPct: number; // height (% of canvas height)
  opacity: number; // 0-100
}

export interface TextLayerData extends BaseLayer {
  type: "text";
  text: string;
  fontSizePct: number; // % of canvas height
  color: string;
  fontFamily: string;
  bold: boolean;
  align: "left" | "center" | "right";
}

type Layer = ImageLayerData | TextLayerData;
type ResizeHandle = "tl" | "tr" | "bl" | "br";
type InteractionType = "move" | ResizeHandle;

interface Interaction {
  layerId: string;
  type: InteractionType;
  startX: number;
  startY: number;
  origLayer: Layer;
  cW: number;
  cH: number;
}

interface CompositeEditorProps {
  backgroundUrl: string;
  productImages?: string[]; // blob: or https: URLs
  onClose: () => void;
}

// ────────── Constants ──────────

const FONTS = [
  { value: "sans-serif",  label: "ゴシック体" },
  { value: "serif",       label: "明朝体" },
  { value: "Impact",      label: "Impact" },
  { value: "Arial Black", label: "Arial Black" },
];

const QUICK_COLORS = [
  "#ffffff","#000000","#ff3333","#ff9900",
  "#ffee00","#33cc66","#3399ff","#cc44cc",
];

const HANDLE = 10; // handle px size

// ────────── Helpers ──────────

const uid = () => Math.random().toString(36).slice(2, 9);
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** ArrayBuffer を安全に base64 変換 */
function toBase64(ab: ArrayBuffer): string {
  const bytes = new Uint8Array(ab);
  let bin = "";
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(bin);
}

// ────────── Component ──────────

export function CompositeEditor({
  backgroundUrl,
  productImages = [],
  onClose,
}: CompositeEditorProps) {
  // 商品画像を初期レイヤーとして配置
  const [layers, setLayers] = useState<Layer[]>(() =>
    productImages.map((src, i) => ({
      id: uid(),
      type: "image",
      name: `商品画像 ${i + 1}`,
      src,
      xPct: 20 + (i % 3) * 30,
      yPct: 30 + Math.floor(i / 3) * 40,
      wPct: 30,
      hPct: 30,
      opacity: 100,
      visible: true,
    } satisfies ImageLayerData))
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [exporting,     setExporting]     = useState(false);
  const [exportingPsd,  setExportingPsd]  = useState(false);

  const bgRef      = useRef<HTMLImageElement>(null);
  const fileRef    = useRef<HTMLInputElement>(null);
  const interaction = useRef<Interaction | null>(null);
  const [disp, setDisp] = useState({ w: 0, h: 0 });

  // 表示サイズを追跡
  useEffect(() => {
    const el = bgRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => {
      if (bgRef.current) setDisp({ w: bgRef.current.offsetWidth, h: bgRef.current.offsetHeight });
    });
    obs.observe(el);
    if (el.complete) setDisp({ w: el.offsetWidth, h: el.offsetHeight });
    return () => obs.disconnect();
  }, []);

  // ── Layer utilities ──

  const update = useCallback((id: string, patch: Partial<Layer>) =>
    setLayers(prev => prev.map(l => l.id === id ? ({ ...l, ...patch } as Layer) : l)), []);

  const remove = useCallback((id: string) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    setSelectedId(null);
    setEditingId(null);
  }, []);

  const shift = (id: string, dir: 1 | -1) => {
    setLayers(prev => {
      const i = prev.findIndex(l => l.id === id);
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const arr = [...prev];
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  };

  // ── Pointer interactions ──

  const startInteraction = (e: React.PointerEvent, id: string, type: InteractionType) => {
    if (!bgRef.current) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const layer = layers.find(l => l.id === id)!;
    interaction.current = {
      layerId: id, type,
      startX: e.clientX, startY: e.clientY,
      origLayer: { ...layer },
      cW: bgRef.current.offsetWidth,
      cH: bgRef.current.offsetHeight,
    };
    setSelectedId(id);
    setEditingId(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const ia = interaction.current;
    if (!ia) return;
    const dx = e.clientX - ia.startX;
    const dy = e.clientY - ia.startY;
    const { cW, cH, origLayer: o } = ia;

    if (ia.type === "move") {
      update(ia.layerId, {
        xPct: clamp(o.xPct + (dx / cW) * 100, 0, 100),
        yPct: clamp(o.yPct + (dy / cH) * 100, 0, 100),
      });
      return;
    }

    // resize (image only)
    if (o.type !== "image") return;
    const oi = o as ImageLayerData;
    const oW = oi.wPct / 100 * cW;
    const oH = oi.hPct / 100 * cH;
    const oL = oi.xPct / 100 * cW - oW / 2;
    const oT = oi.yPct / 100 * cH - oH / 2;
    const oR = oL + oW;
    const oB = oT + oH;

    let l = oL, t = oT, r = oR, b = oB;
    if (ia.type === "tl") { l = oL + dx; t = oT + dy; }
    if (ia.type === "tr") { r = oR + dx; t = oT + dy; }
    if (ia.type === "bl") { l = oL + dx; b = oB + dy; }
    if (ia.type === "br") { r = oR + dx; b = oB + dy; }

    const nW = Math.max(10, r - l);
    const nH = Math.max(10, b - t);
    update(ia.layerId, {
      wPct: (nW / cW) * 100,
      hPct: (nH / cH) * 100,
      xPct: ((l + nW / 2) / cW) * 100,
      yPct: ((t + nH / 2) / cH) * 100,
    });
  };

  const onPointerUp = () => { interaction.current = null; };

  // ── Add from file ──

  const addImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setLayers(prev => [...prev, {
      id: uid(), type: "image",
      name: file.name.replace(/\.[^.]+$/, ""),
      src, xPct: 50, yPct: 50, wPct: 35, hPct: 35, opacity: 100, visible: true,
    } satisfies ImageLayerData]);
    e.target.value = "";
  };

  const addText = () => {
    const id = uid();
    setLayers(prev => [...prev, {
      id, type: "text", name: "テキスト",
      text: "テキスト", xPct: 50, yPct: 50,
      fontSizePct: 7, color: "#ffffff",
      fontFamily: "sans-serif", bold: true,
      align: "center", visible: true,
    } satisfies TextLayerData]);
    setSelectedId(id);
    setEditingId(id);
  };

  // ── PNG export (canvas) ──

  const handleExportPng = async () => {
    const bg = bgRef.current;
    if (!bg) return;
    setExporting(true);
    try {
      await new Promise<void>(r => bg.complete ? r() : (bg.onload = () => r()));
      const W = bg.naturalWidth || bg.offsetWidth;
      const H = bg.naturalHeight || bg.offsetHeight;
      const cv = document.createElement("canvas");
      cv.width = W; cv.height = H;
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(bg, 0, 0, W, H);

      for (const layer of layers) {
        if (!layer.visible) continue;
        if (layer.type === "image") {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>(r => { img.onload = () => r(); img.onerror = () => r(); img.src = layer.src; });
          const lW = (layer.wPct / 100) * W;
          const lH = (layer.hPct / 100) * H;
          ctx.save();
          ctx.globalAlpha = layer.opacity / 100;
          ctx.drawImage(img, (layer.xPct / 100) * W - lW / 2, (layer.yPct / 100) * H - lH / 2, lW, lH);
          ctx.restore();
        } else {
          const px = (layer.fontSizePct / 100) * H;
          ctx.save();
          ctx.font = `${layer.bold ? "bold " : ""}${px}px "${layer.fontFamily}"`;
          ctx.fillStyle = layer.color;
          ctx.textAlign = layer.align as CanvasTextAlign;
          ctx.textBaseline = "middle";
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = px * 0.1;
          ctx.fillText(layer.text, (layer.xPct / 100) * W, (layer.yPct / 100) * H);
          ctx.restore();
        }
      }

      cv.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "bannerforge-composite.png"; a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } finally { setExporting(false); }
  };

  // ── PSD export (server) ──

  const handleExportPsd = async () => {
    setExportingPsd(true);
    try {
      const layersForExport = await Promise.all(
        layers.map(async layer => {
          if (layer.type === "image" && layer.src.startsWith("blob:")) {
            const res = await fetch(layer.src);
            const ab = await res.arrayBuffer();
            return { ...layer, srcBase64: toBase64(ab), mimeType: "image/jpeg" };
          }
          return layer;
        })
      );

      const res = await fetch("/api/export/psd-composite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backgroundUrl, layers: layersForExport }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "PSDのエクスポートに失敗しました");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "bannerforge-composite.psd"; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "エクスポートに失敗しました");
    } finally { setExportingPsd(false); }
  };

  // ── Render ──

  const sel = layers.find(l => l.id === selectedId);
  const { w: dW, h: dH } = disp;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 h-14 bg-[#0f0f1e] border-b border-white/10 shrink-0">
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition shrink-0">
          <X className="w-5 h-5 text-white" />
        </button>
        <span className="text-white font-semibold text-sm shrink-0">レイヤー編集</span>
        <span className="text-white/30 text-xs hidden sm:block">ドラッグで移動 / 角をドラッグでリサイズ / Wクリックでテキスト編集</span>
        <div className="flex-1" />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition shrink-0"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">画像追加</span>
        </button>
        <button
          onClick={addText}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition shrink-0"
        >
          <Type className="w-4 h-4" />
          <span className="hidden sm:inline">テキスト</span>
        </button>
        <button
          onClick={handleExportPsd}
          disabled={exportingPsd}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-700 hover:bg-violet-600 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition shrink-0"
        >
          {exportingPsd ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileImage className="w-4 h-4" />}
          <span className="hidden sm:inline">{exportingPsd ? "作成中..." : "PSD"}</span>
        </button>
        <button
          onClick={handleExportPng}
          disabled={exporting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-lg text-sm font-medium transition shrink-0"
        >
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span className="hidden sm:inline">{exporting ? "書き出し中..." : "PNG"}</span>
        </button>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={addImageFile} />

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas area */}
        <div
          className="flex-1 flex items-center justify-center p-4 overflow-hidden"
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onClick={() => { setSelectedId(null); setEditingId(null); }}
        >
          <div className="relative inline-block">
            {/* Background image */}
            <img
              ref={bgRef}
              src={backgroundUrl}
              alt="background"
              crossOrigin="anonymous"
              draggable={false}
              className="block max-w-full"
              style={{ maxHeight: "calc(100vh - 200px)", display: "block" }}
              onLoad={() => {
                if (bgRef.current) setDisp({ w: bgRef.current.offsetWidth, h: bgRef.current.offsetHeight });
              }}
            />

            {/* Layers */}
            {dW > 0 && layers.map(layer => {
              if (!layer.visible) return null;
              const isSelected = selectedId === layer.id;

              if (layer.type === "image") {
                const lW = (layer.wPct / 100) * dW;
                const lH = (layer.hPct / 100) * dH;
                const lX = (layer.xPct / 100) * dW;
                const lY = (layer.yPct / 100) * dH;

                return (
                  <div
                    key={layer.id}
                    style={{
                      position: "absolute",
                      left: lX, top: lY,
                      width: lW, height: lH,
                      transform: "translate(-50%, -50%)",
                      outline: isSelected ? "2px solid #818cf8" : "none",
                      outlineOffset: 2,
                      cursor: "grab",
                      userSelect: "none",
                      opacity: layer.opacity / 100,
                    }}
                    onPointerDown={e => startInteraction(e, layer.id, "move")}
                    onClick={e => e.stopPropagation()}
                  >
                    <img
                      src={layer.src}
                      alt={layer.name}
                      draggable={false}
                      style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none", display: "block" }}
                    />

                    {/* Resize handles */}
                    {isSelected && (["tl","tr","bl","br"] as ResizeHandle[]).map(h => (
                      <div
                        key={h}
                        style={{
                          position: "absolute",
                          width: HANDLE, height: HANDLE,
                          background: "#6366f1",
                          border: "2px solid white",
                          borderRadius: 2,
                          zIndex: 10,
                          ...(h==="tl" ? { top: -HANDLE/2, left: -HANDLE/2 }
                            : h==="tr" ? { top: -HANDLE/2, right: -HANDLE/2 }
                            : h==="bl" ? { bottom: -HANDLE/2, left: -HANDLE/2 }
                            :            { bottom: -HANDLE/2, right: -HANDLE/2 }),
                          cursor: (h==="tl"||h==="br") ? "nwse-resize" : "nesw-resize",
                        }}
                        onPointerDown={e => startInteraction(e, layer.id, h)}
                      />
                    ))}
                  </div>
                );
              }

              // Text layer
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
                    outline: isSelected ? "2px dashed #818cf8" : "none",
                    outlineOffset: 4,
                    padding: "2px 6px",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                  onPointerDown={e => startInteraction(e, layer.id, "move")}
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
                        background: "transparent", border: "none", outline: "none",
                        font: "inherit", color: "inherit", textAlign: layer.align,
                        width: `${Math.max(layer.text.length + 3, 5) * 0.65}em`,
                        minWidth: "4em",
                      }}
                    />
                  ) : layer.text}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div className="w-64 bg-[#0f0f1e] border-l border-white/10 flex flex-col min-h-0">
          {/* Properties */}
          {sel && (
            <div className="shrink-0 border-b border-white/10 p-3 space-y-2.5 overflow-y-auto max-h-64">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-semibold">
                  {sel.type === "image" ? "画像プロパティ" : "テキストプロパティ"}
                </span>
                <button onClick={() => remove(sel.id)} className="p-1 hover:bg-red-500/20 text-red-400 rounded transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {sel.type === "image" ? (
                <>
                  <div>
                    <label className="text-xs text-white/50">不透明度: {(sel as ImageLayerData).opacity}%</label>
                    <input
                      type="range" min={10} max={100} value={(sel as ImageLayerData).opacity}
                      onChange={e => update(sel.id, { opacity: +e.target.value })}
                      className="w-full accent-indigo-500 mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-xs text-white/40">
                    <span>W: {(sel as ImageLayerData).wPct.toFixed(1)}%</span>
                    <span>H: {(sel as ImageLayerData).hPct.toFixed(1)}%</span>
                  </div>
                </>
              ) : (
                <>
                  <textarea
                    value={(sel as TextLayerData).text}
                    onChange={e => update(sel.id, { text: e.target.value })}
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs resize-none focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={(sel as TextLayerData).fontFamily}
                    onChange={e => update(sel.id, { fontFamily: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-white text-xs focus:outline-none"
                  >
                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                  <div>
                    <label className="text-xs text-white/50">サイズ: {(sel as TextLayerData).fontSizePct}%</label>
                    <input
                      type="range" min={2} max={25} value={(sel as TextLayerData).fontSizePct}
                      onChange={e => update(sel.id, { fontSizePct: +e.target.value })}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color" value={(sel as TextLayerData).color}
                      onChange={e => update(sel.id, { color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent shrink-0"
                    />
                    <div className="flex flex-wrap gap-1">
                      {QUICK_COLORS.map(c => (
                        <button key={c} onClick={() => update(sel.id, { color: c })}
                          style={{ background: c }}
                          className="w-5 h-5 rounded border border-white/20 hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">ボールド</span>
                    <button
                      onClick={() => update(sel.id, { bold: !(sel as TextLayerData).bold })}
                      className={`relative w-9 h-5 rounded-full transition-colors ${(sel as TextLayerData).bold ? "bg-indigo-600" : "bg-white/20"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${(sel as TextLayerData).bold ? "translate-x-4" : ""}`} />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    {(["left","center","right"] as const).map(a => (
                      <button key={a} onClick={() => update(sel.id, { align: a })}
                        className={`flex-1 py-1 text-xs rounded transition ${(sel as TextLayerData).align === a ? "bg-indigo-600 text-white" : "bg-white/5 text-white/50 hover:bg-white/10"}`}
                      >
                        {a === "left" ? "左" : a === "center" ? "中" : "右"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Layer list */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wide">レイヤー</p>
              <div className="flex gap-1">
                <button onClick={() => fileRef.current?.click()} className="p-1 hover:bg-white/10 text-white/40 hover:text-white rounded transition" title="画像追加">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button onClick={addText} className="p-1 hover:bg-white/10 text-white/40 hover:text-white rounded transition" title="テキスト追加">
                  <Type className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Layers (top = last in array) */}
            {[...layers].reverse().map((layer, ri) => {
              const origIdx = layers.length - 1 - ri;
              return (
                <div
                  key={layer.id}
                  onClick={() => { setSelectedId(layer.id); setEditingId(null); }}
                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition ${selectedId === layer.id ? "bg-indigo-600/20" : "hover:bg-white/5"}`}
                >
                  {layer.type === "image"
                    ? <ImageIcon className="w-3 h-3 shrink-0 text-blue-400" />
                    : <Type className="w-3 h-3 shrink-0 text-green-400" />}
                  <span className={`text-xs flex-1 truncate ${selectedId === layer.id ? "text-white" : "text-white/60"}`}>
                    {layer.name}
                  </span>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button onClick={e => { e.stopPropagation(); shift(layer.id, 1); }} className="p-0.5 hover:text-white text-white/30 transition" title="上へ">
                      <ChevronUp className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); shift(layer.id, -1); }} className="p-0.5 hover:text-white text-white/30 transition" title="下へ">
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); update(layer.id, { visible: !layer.visible }); }} className="p-0.5 hover:text-white text-white/30 transition">
                      {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Background (fixed bottom) */}
            <div className="flex items-center gap-2 px-3 py-2 opacity-40 border-t border-white/5 mt-auto">
              <ImageIcon className="w-3 h-3 text-white/50 shrink-0" />
              <span className="text-xs text-white/50">背景 (固定)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
