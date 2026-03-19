"use client";

import { useState, useRef, useCallback } from "react";
import {
  Globe, Wand2, Monitor, Smartphone, Code2,
  Download, Copy, Check, Loader2, RefreshCw, FileText,
  ChevronDown, ChevronUp, Upload, X,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

type SiteType = "lp" | "corporate" | "ec" | "portfolio" | "saas" | "blog";
type SiteStyle = "minimal" | "modern" | "bold" | "dark" | "creative" | "clean";
type AnimationLevel = "none" | "subtle" | "rich";
type PreviewMode = "desktop" | "mobile" | "code";

type HearingData = {
  businessName: string;
  industry: string;
  targetAge: string;
  targetGender: string;
  targetOccupation: string;
  targetNeeds: string;
  strength1: string;
  strength2: string;
  strength3: string;
  competitors: string;
  referenceUrls: string;
  brandTone: string;
};

// WebCraft の HearingSheet から BannerForge 用に変換するキーのマッピング
type WebCraftImport = {
  clientName?: string;
  clientIndustry?: string;
  personaAge?: string;
  personaGender?: string;
  personaOccupation?: string;
  personaNeeds?: string;
  strengths?: string;
  competitors?: string;
  referenceUrls?: string;
  brandMessage?: string;
  siteType?: string;
  designPreference?: string;
};

const DEFAULT_HEARING: HearingData = {
  businessName: "",
  industry: "",
  targetAge: "",
  targetGender: "",
  targetOccupation: "",
  targetNeeds: "",
  strength1: "",
  strength2: "",
  strength3: "",
  competitors: "",
  referenceUrls: "",
  brandTone: "",
};

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

const ANIMATION_LEVELS: { value: AnimationLevel; label: string; desc: string }[] = [
  { value: "none",   label: "なし",       desc: "静的・アニメーションなし" },
  { value: "subtle", label: "ひかえめ",   desc: "ホバー・フェードイン程度" },
  { value: "rich",   label: "リッチ",     desc: "スクロール連動・パーティクル等" },
];

const TARGET_AGE_OPTIONS = [
  "10代", "20代前半", "20代後半", "30代前半", "30代後半",
  "40代", "50代", "60代以上", "全年齢",
];

const BRAND_TONE_OPTIONS = [
  "プロフェッショナル・信頼感",
  "フレンドリー・親しみやすい",
  "ラグジュアリー・高級感",
  "ポップ・明るい・楽しい",
  "クール・スタイリッシュ",
  "ナチュラル・温かみ",
  "革新的・テック感",
];

// ── Import Modal ────────────────────────────────────────

function ImportModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (data: HearingData, siteType?: SiteType) => void;
}) {
  const [json, setJson] = useState("");
  const [err, setErr] = useState("");

  const handleImport = () => {
    try {
      const raw = JSON.parse(json) as WebCraftImport;
      const strengths = (raw.strengths ?? "").split(/[\n,，、]/).map(s => s.trim()).filter(Boolean);
      const hearing: HearingData = {
        businessName:    raw.clientName ?? "",
        industry:        raw.clientIndustry ?? "",
        targetAge:       raw.personaAge ?? "",
        targetGender:    raw.personaGender ?? "",
        targetOccupation: raw.personaOccupation ?? "",
        targetNeeds:     raw.personaNeeds ?? "",
        strength1:       strengths[0] ?? "",
        strength2:       strengths[1] ?? "",
        strength3:       strengths[2] ?? "",
        competitors:     raw.competitors ?? "",
        referenceUrls:   raw.referenceUrls ?? "",
        brandTone:       raw.brandMessage ?? raw.designPreference ?? "",
      };
      // サイトタイプの変換（WebCraft の日本語 → BannerForge の英語キー）
      const siteTypeMap: Record<string, SiteType> = {
        "LP": "lp", "ランディングページ": "lp",
        "コーポレート": "corporate", "企業サイト": "corporate",
        "EC": "ec", "ECサイト": "ec",
        "ポートフォリオ": "portfolio",
        "SaaS": "saas", "サービスサイト": "saas",
        "ブログ": "blog", "メディア": "blog",
      };
      const mappedSiteType = raw.siteType ? siteTypeMap[raw.siteType] : undefined;
      onImport(hearing, mappedSiteType);
    } catch {
      setErr("JSONの形式が正しくありません。WebCraftのヒアリングページから「BannerForgeで使用」ボタンでコピーしてください。");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 w-[500px] max-h-[80vh] flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white">WebCraftからインポート</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-white/50">
          WebCraftのヒアリングページ右上の「BannerForgeで使用」ボタンをクリックし、
          コピーされたJSONを以下に貼り付けてください。
        </p>
        <textarea
          value={json}
          onChange={e => { setJson(e.target.value); setErr(""); }}
          placeholder='{"clientName": "...", "clientIndustry": "..."}'
          rows={8}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-white/20 resize-none focus:outline-none focus:border-indigo-500"
        />
        {err && <p className="text-xs text-red-400">{err}</p>}
        <button
          onClick={handleImport}
          disabled={!json.trim()}
          className="py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg font-semibold text-sm transition"
        >
          インポートして入力
        </button>
      </div>
    </div>
  );
}

// ── Component ──────────────────────────────────────────

export default function WebDesignPage() {
  const [prompt, setPrompt] = useState("");
  const [siteType, setSiteType] = useState<SiteType>("lp");
  const [style, setStyle] = useState<SiteStyle>("modern");
  const [primaryColor, setPrimaryColor] = useState("#6366F1");
  const [sections, setSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [animation, setAnimation] = useState<AnimationLevel>("subtle");
  const [isGenerating, setIsGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState("");

  // 詳細モード
  const [detailMode, setDetailMode] = useState(false);
  const [hearing, setHearing] = useState<HearingData>(DEFAULT_HEARING);
  const [showImportModal, setShowImportModal] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const updateHearing = (key: keyof HearingData, value: string) => {
    setHearing(prev => ({ ...prev, [key]: value }));
  };

  const toggleSection = (val: string) => {
    setSections(prev =>
      prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
    );
  };

  const handleImport = (data: HearingData, mappedSiteType?: SiteType) => {
    setHearing(data);
    if (mappedSiteType) setSiteType(mappedSiteType);
    setDetailMode(true);
    setShowImportModal(false);
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
        body: JSON.stringify({
          prompt, siteType, style, primaryColor, sections, animation,
          hearing: detailMode ? hearing : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成に失敗しました");
      setHtml(data.html ?? "");
      setImageUrl(data.imageUrl ?? "");
      setPreviewMode("desktop");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, siteType, style, primaryColor, sections, animation, detailMode, hearing]);

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

  const handleExportPdf = () => {
    const win = window.open("", "_blank");
    if (!win) { alert("ポップアップをブロックしています。許可してください。"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 800);
  };

  // 詳細モードで入力済みのフィールド数
  const filledHearingCount = Object.values(hearing).filter(v => v.trim().length > 0).length;

  return (
    <>
      {showImportModal && (
        <ImportModal onClose={() => setShowImportModal(false)} onImport={handleImport} />
      )}

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

            {/* アニメーション */}
            <div className="bg-[#0f0f1e] rounded-xl border border-white/10 p-4">
              <h3 className="font-semibold text-white text-sm mb-3">アニメーション</h3>
              <div className="grid grid-cols-3 gap-2">
                {ANIMATION_LEVELS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => setAnimation(a.value)}
                    className={`p-2.5 rounded-lg border text-center transition ${
                      animation === a.value
                        ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
                    }`}
                  >
                    <div className="font-semibold text-xs">{a.label}</div>
                    <div className="text-[10px] text-white/40 mt-0.5 leading-tight">{a.desc}</div>
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
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/25 resize-none focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* 詳細モード トグル */}
            <div className="bg-[#0f0f1e] rounded-xl border border-white/10 overflow-hidden">
              <button
                onClick={() => setDetailMode(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-white">詳細モード（ヒアリング情報）</span>
                  {filledHearingCount > 0 && (
                    <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-medium">
                      {filledHearingCount}項目入力済み
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/30">精度向上</span>
                  {detailMode
                    ? <ChevronUp className="w-4 h-4 text-white/40" />
                    : <ChevronDown className="w-4 h-4 text-white/40" />
                  }
                </div>
              </button>

              {detailMode && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                  {/* WebCraftインポートボタン */}
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-indigo-500/40 rounded-lg text-indigo-400 text-xs font-medium hover:bg-indigo-500/10 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    WebCraftのヒアリングデータをインポート
                  </button>

                  {/* ビジネス情報 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">ビジネス情報</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">ビジネス名・ブランド名</label>
                        <input
                          type="text"
                          value={hearing.businessName}
                          onChange={e => updateHearing("businessName", e.target.value)}
                          placeholder="例：自然の恵み"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">業種・カテゴリ</label>
                        <input
                          type="text"
                          value={hearing.industry}
                          onChange={e => updateHearing("industry", e.target.value)}
                          placeholder="例：コスメ・美容"
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ターゲット */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">ターゲット</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">年齢層</label>
                        <select
                          value={hearing.targetAge}
                          onChange={e => updateHearing("targetAge", e.target.value)}
                          className="w-full bg-[#0a0a18] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">選択...</option>
                          {TARGET_AGE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-white/40 mb-1 block">性別</label>
                        <select
                          value={hearing.targetGender}
                          onChange={e => updateHearing("targetGender", e.target.value)}
                          className="w-full bg-[#0a0a18] border border-white/10 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">選択...</option>
                          <option value="女性">女性</option>
                          <option value="男性">男性</option>
                          <option value="性別問わず">性別問わず</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">職業・ライフスタイル</label>
                      <input
                        type="text"
                        value={hearing.targetOccupation}
                        onChange={e => updateHearing("targetOccupation", e.target.value)}
                        placeholder="例：会社員、子育て中の主婦"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">課題・ニーズ</label>
                      <input
                        type="text"
                        value={hearing.targetNeeds}
                        onChange={e => updateHearing("targetNeeds", e.target.value)}
                        placeholder="例：敏感肌で使える安全なコスメを探している"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* USP / 強み */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">USP・強み（3つ）</p>
                    {([
                      { key: "strength1" as const, ph: "例：100%天然由来成分" },
                      { key: "strength2" as const, ph: "例：皮膚科医監修・低刺激" },
                      { key: "strength3" as const, ph: "例：30日間返金保証" },
                    ]).map(({ key, ph }, i) => (
                      <div key={key} className="flex items-center gap-2">
                        <span className="text-xs text-indigo-400 w-4 shrink-0">{i + 1}</span>
                        <input
                          type="text"
                          value={hearing[key]}
                          onChange={e => updateHearing(key, e.target.value)}
                          placeholder={ph}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>

                  {/* 競合・参考 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">参考・競合</p>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">競合サイト URL</label>
                      <input
                        type="text"
                        value={hearing.competitors}
                        onChange={e => updateHearing("competitors", e.target.value)}
                        placeholder="https://example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/40 mb-1 block">参考デザイン URL</label>
                      <input
                        type="text"
                        value={hearing.referenceUrls}
                        onChange={e => updateHearing("referenceUrls", e.target.value)}
                        placeholder="https://example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* ブランドトーン */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">ブランドトーン</p>
                    <div className="flex flex-wrap gap-1.5">
                      {BRAND_TONE_OPTIONS.map(t => (
                        <button
                          key={t}
                          onClick={() => updateHearing("brandTone", hearing.brandTone === t ? "" : t)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                            hearing.brandTone === t
                              ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                              : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={BRAND_TONE_OPTIONS.includes(hearing.brandTone) ? "" : hearing.brandTone}
                      onChange={e => updateHearing("brandTone", e.target.value)}
                      placeholder="または自由入力..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder-white/20 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}
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

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-medium transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  再生成
                </button>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-medium transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "コピー済み" : "HTMLをコピー"}
                </button>

                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDFで保存
                </button>

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
                <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#0f0f1e]">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                  <div className="text-center">
                    <p className="font-medium text-white">Stitch がデザインを生成中...</p>
                    <p className="text-sm text-white/40 mt-1">Google Stitch AI が生成しています（30〜60秒）</p>
                  </div>
                </div>
              ) : html ? (
                previewMode === "code" ? (
                  <pre className="h-full overflow-auto bg-[#0d0d1a] text-green-300 text-xs p-4 font-mono leading-relaxed">
                    <code>{html}</code>
                  </pre>
                ) : previewMode === "desktop" && imageUrl ? (
                  <div className="h-full overflow-auto bg-gray-200 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Stitch generated design"
                      className="w-full object-contain object-top"
                    />
                  </div>
                ) : (
                  <div className={`h-full flex items-start justify-center bg-gray-200 overflow-auto ${previewMode === "mobile" ? "py-4" : ""}`}>
                    <iframe
                      ref={iframeRef}
                      srcDoc={html}
                      sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
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
    </>
  );
}
