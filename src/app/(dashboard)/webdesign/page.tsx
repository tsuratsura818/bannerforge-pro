"use client";

import { useState, useRef, useCallback } from "react";
import {
  Globe, Wand2, Monitor, Smartphone, Code2,
  Download, Copy, Check, Loader2, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

type SiteType = "lp" | "corporate" | "ec" | "portfolio" | "saas" | "blog";
type SiteStyle = "minimal" | "modern" | "bold" | "dark" | "creative" | "clean";
type PreviewMode = "desktop" | "mobile" | "code";

// ── Constants ──────────────────────────────────────────

const SITE_TYPES: { value: SiteType; label: string; desc: string }[] = [
  { value: "lp",        label: "LP",           desc: "ランディングページ" },
  { value: "corporate", label: "コーポレート",  desc: "企業・団体サイト" },
  { value: "ec",        label: "EC",           desc: "ショッピングサイト" },
  { value: "portfolio", label: "ポートフォリオ", desc: "作品・実績紹介" },
  { value: "saas",      label: "SaaS",         desc: "プロダクト紹介" },
  { value: "blog",      label: "ブログ",        desc: "メディア・記事" },
];

const STYLES: { value: SiteStyle; label: string; emoji: string }[] = [
  { value: "minimal",  label: "ミニマル",   emoji: "◻️" },
  { value: "modern",   label: "モダン",     emoji: "✨" },
  { value: "bold",     label: "ボールド",   emoji: "⚡" },
  { value: "dark",     label: "ダーク",     emoji: "🌙" },
  { value: "creative", label: "クリエイティブ", emoji: "🎨" },
  { value: "clean",    label: "クリーン",   emoji: "🏢" },
];

const COLOR_PRESETS = [
  { label: "ブルー",    value: "#3B82F6" },
  { label: "インディゴ", value: "#6366F1" },
  { label: "パープル",  value: "#8B5CF6" },
  { label: "グリーン",  value: "#10B981" },
  { label: "オレンジ",  value: "#F59E0B" },
  { label: "レッド",    value: "#EF4444" },
  { label: "ピンク",    value: "#EC4899" },
  { label: "ティール",  value: "#14B8A6" },
];

const SECTIONS = [
  { value: "nav",          label: "ナビゲーション" },
  { value: "hero",         label: "ヒーロー" },
  { value: "features",     label: "特徴・機能" },
  { value: "stats",        label: "実績・数字" },
  { value: "pricing",      label: "料金プラン" },
  { value: "testimonials", label: "お客様の声" },
  { value: "faq",          label: "FAQ" },
  { value: "team",         label: "チーム紹介" },
  { value: "contact",      label: "お問い合わせ" },
  { value: "footer",       label: "フッター" },
];

const DEFAULT_SECTIONS = ["nav", "hero", "features", "footer"];

// ── Component ──────────────────────────────────────────

export default function WebDesignPage() {
  const [prompt, setPrompt] = useState("");
  const [siteType, setSiteType] = useState<SiteType>("lp");
  const [style, setStyle] = useState<SiteStyle>("modern");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [isGenerating, setIsGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [copied, setCopied] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleSection = (val: string) => {
    setSections(prev =>
      prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) { setError("サイトのコンセプトを入力してください"); return; }
    if (sections.length === 0) { setError("セクションを1つ以上選択してください"); return; }

    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate/webdesign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, siteType, style, primaryColor, sections }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      setHtml(data.html ?? "");
      setPreviewMode("desktop");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, siteType, style, primaryColor, sections]);

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bannerforge-webdesign-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-400" />
          WEBデザイン生成
        </h1>
        <p className="text-gray-500 mt-1">AIがコンセプトを元に完全なHTMLウェブサイトを生成します</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-[340px_1fr] gap-6 min-h-0">
        {/* 左：設定パネル */}
        <div className="space-y-4 overflow-y-auto pr-1">

          {/* サイトタイプ */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold text-white text-sm mb-3">サイトタイプ</h3>
            <div className="grid grid-cols-3 gap-2">
              {SITE_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setSiteType(t.value)}
                  className={`p-2 rounded-lg border text-center transition ${
                    siteType === t.value
                      ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                  }`}
                >
                  <div className="font-semibold text-xs">{t.label}</div>
                  <div className="text-[10px] text-white/40 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* スタイル */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold text-white text-sm mb-3">デザインスタイル</h3>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`p-2 rounded-lg border text-center transition ${
                    style === s.value
                      ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                  }`}
                >
                  <div className="text-base mb-0.5">{s.emoji}</div>
                  <div className="text-xs font-medium">{s.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* カラーテーマ */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold text-white text-sm mb-3">プライマリカラー</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setPrimaryColor(c.value)}
                  title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    primaryColor === c.value ? "border-white scale-110" : "border-transparent"
                  }`}
                  style={{ background: c.value }}
                />
              ))}
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border border-white/20 bg-transparent"
                title="カスタムカラー"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-white/40">
              <div className="w-4 h-4 rounded" style={{ background: primaryColor }} />
              <span>{primaryColor}</span>
            </div>
          </div>

          {/* セクション */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold text-white text-sm mb-3">含めるセクション</h3>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map(s => (
                <button
                  key={s.value}
                  onClick={() => toggleSection(s.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    sections.includes(s.value)
                      ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                      : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* プロンプト */}
          <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4">
            <h3 className="font-semibold text-white text-sm mb-2">サイトのコンセプト</h3>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="例：オーガニックコスメブランド「自然の恵み」のLP。ターゲットは30代女性。自然素材・環境配慮を前面に出したクリーンなデザイン。商品はスキンケア3点セット。"
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2"
          >
            <Wand2 className="w-5 h-5" />
            {isGenerating ? "AIがデザインを生成中... (30〜60秒)" : "WEBデザインを生成する"}
          </button>
        </div>

        {/* 右：プレビュー */}
        <div className="flex flex-col min-h-0 gap-3">
          {/* プレビューコントロール */}
          {html && (
            <div className="flex items-center gap-2 shrink-0">
              {/* 表示切替 */}
              <div className="flex bg-[#0f0f1e] border border-white/10 rounded-lg p-1 gap-1">
                {([
                  { mode: "desktop" as const, icon: Monitor, label: "PC" },
                  { mode: "mobile"  as const, icon: Smartphone, label: "モバイル" },
                  { mode: "code"    as const, icon: Code2, label: "コード" },
                ] as const).map(({ mode, icon: Icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      previewMode === mode
                        ? "bg-indigo-600 text-white"
                        : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <div className="flex-1" />

              {/* 再生成 */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-medium transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                再生成
              </button>

              {/* コピー */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "コピー済み" : "HTMLをコピー"}
              </button>

              {/* ダウンロード */}
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
              >
                <Download className="w-3.5 h-3.5" />
                HTMLダウンロード
              </button>
            </div>
          )}

          {/* プレビューエリア */}
          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 bg-gray-100">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500 bg-[#0f0f1e]">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-white">AIがデザインを生成中...</p>
                  <p className="text-sm text-white/40 mt-1">Gemini がHTMLを生成しています（30〜60秒）</p>
                </div>
              </div>
            ) : html ? (
              previewMode === "code" ? (
                <pre className="h-full overflow-auto bg-[#0d0d1a] text-green-300 text-xs p-4 font-mono leading-relaxed">
                  <code>{html}</code>
                </pre>
              ) : (
                <div className={`h-full flex items-start justify-center bg-gray-200 overflow-auto ${previewMode === "mobile" ? "py-4" : ""}`}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    sandbox="allow-scripts"
                    className={`bg-white shadow-2xl ${
                      previewMode === "mobile"
                        ? "w-[390px] h-[844px] rounded-3xl"
                        : "w-full h-full"
                    }`}
                    title="WEBデザインプレビュー"
                  />
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 bg-[#0f0f1e]">
                <Globe className="w-12 h-12 text-white/10" />
                <div className="text-center">
                  <p className="font-medium text-white/40">生成されたWEBデザインがここに表示されます</p>
                  <p className="text-sm text-white/25 mt-1">左のパネルで設定して「生成する」を押してください</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
