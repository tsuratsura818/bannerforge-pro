"use client";

import { useState, useRef, useCallback } from "react";
import {
  Globe, Wand2, Monitor, Smartphone, Code2,
  Download, Copy, Check, Loader2, RefreshCw, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

type SiteType = "lp" | "corporate" | "ec" | "portfolio" | "saas" | "blog";
type SiteStyle = "minimal" | "modern" | "bold" | "dark" | "creative" | "clean";
type AnimationLevel = "none" | "subtle" | "rich";
type PreviewMode = "desktop" | "mobile" | "code";

type HearingData = {
  // Step 1: 基本情報
  businessName: string;
  industry: string;
  siteUrl: string;
  projectGoal: string;
  // Step 2: ターゲット
  targetAge: string;
  targetGender: string;
  targetOccupation: string;
  targetNeeds: string;
  customerJourney: string;
  // Step 3: ブランド・強み
  strength1: string;
  strength2: string;
  strength3: string;
  brandMessage: string;
  competitors: string;
  referenceUrls: string;
  // Step 4: デザイン設定
  siteType: SiteType;
  style: SiteStyle;
  primaryColor: string;
  sections: string[];
  animation: AnimationLevel;
  // Step 5: コンセプト
  prompt: string;
};

// ── Constants ──────────────────────────────────────────

const STEPS = [
  { label: "基本情報",   icon: "📋" },
  { label: "ターゲット", icon: "🎯" },
  { label: "ブランド",   icon: "✨" },
  { label: "デザイン",   icon: "🎨" },
  { label: "生成",       icon: "🚀" },
] as const;

const SITE_TYPES: { value: SiteType; label: string; desc: string }[] = [
  { value: "lp",        label: "LP",           desc: "ランディングページ" },
  { value: "corporate", label: "コーポレート",  desc: "企業・団体サイト" },
  { value: "ec",        label: "EC",           desc: "ショッピングサイト" },
  { value: "portfolio", label: "ポートフォリオ", desc: "作品・実績紹介" },
  { value: "saas",      label: "SaaS",         desc: "プロダクト紹介" },
  { value: "blog",      label: "ブログ",        desc: "メディア・記事" },
];

const STYLES: { value: SiteStyle; label: string; emoji: string }[] = [
  { value: "minimal",  label: "ミニマル",       emoji: "◻️" },
  { value: "modern",   label: "モダン",         emoji: "✨" },
  { value: "bold",     label: "ボールド",       emoji: "⚡" },
  { value: "dark",     label: "ダーク",         emoji: "🌙" },
  { value: "creative", label: "クリエイティブ", emoji: "🎨" },
  { value: "clean",    label: "クリーン",       emoji: "🏢" },
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

const ANIMATION_LEVELS: { value: AnimationLevel; label: string; desc: string }[] = [
  { value: "none",   label: "なし",     desc: "静的デザイン" },
  { value: "subtle", label: "ひかえめ", desc: "ホバー・フェード" },
  { value: "rich",   label: "リッチ",   desc: "スクロール連動" },
];

const AGE_OPTIONS = ["10代", "20代前半", "20代後半", "30代前半", "30代後半", "40代", "50代", "60代以上", "全年齢"];
const INDUSTRY_SUGGESTIONS = ["IT・テクノロジー", "小売・EC", "飲食・食品", "美容・コスメ", "医療・健康", "教育・学習", "不動産", "製造業", "コンサルティング", "クリエイティブ"];

const INITIAL: HearingData = {
  businessName: "", industry: "", siteUrl: "", projectGoal: "",
  targetAge: "", targetGender: "", targetOccupation: "", targetNeeds: "", customerJourney: "",
  strength1: "", strength2: "", strength3: "", brandMessage: "", competitors: "", referenceUrls: "",
  siteType: "lp", style: "modern", primaryColor: "#6366F1",
  sections: ["nav", "hero", "features", "footer"],
  animation: "subtle", prompt: "",
};

// ── Small UI helpers ────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-white/50 mb-1.5">{children}</label>;
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-indigo-500 transition"
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-white/20 resize-none focus:outline-none focus:border-indigo-500 transition leading-relaxed"
    />
  );
}

function SelectPills<T extends string>({ options, value, onChange }: {
  options: { value: T; label: string; desc?: string; emoji?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`p-2 rounded-lg border text-center transition ${
            value === o.value
              ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
              : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
          }`}
        >
          {o.emoji && <div className="text-base mb-0.5">{o.emoji}</div>}
          <div className="font-semibold text-xs">{o.label}</div>
          {o.desc && <div className="text-[10px] text-white/40 mt-0.5">{o.desc}</div>}
        </button>
      ))}
    </div>
  );
}

// ── Step panels ─────────────────────────────────────────

function Step1({ d, u }: { d: HearingData; u: (k: keyof HearingData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <Label>ビジネス名・ブランド名 <span className="text-indigo-400">*</span></Label>
        <Input value={d.businessName} onChange={v => u("businessName", v)} placeholder="例：自然の恵み / WOLFGANG" />
      </div>
      <div>
        <Label>業種・カテゴリ</Label>
        <Input value={d.industry} onChange={v => u("industry", v)} placeholder="例：美容・コスメ" />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {INDUSTRY_SUGGESTIONS.map(s => (
            <button key={s} onClick={() => u("industry", s)}
              className={`text-[11px] px-2 py-0.5 rounded-full border transition ${
                d.industry === s ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-white/40 hover:border-white/30 hover:text-white/60"
              }`}>{s}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>既存サイトURL（あれば）</Label>
        <Input value={d.siteUrl} onChange={v => u("siteUrl", v)} placeholder="https://example.com" type="url" />
      </div>
      <div>
        <Label>このサイトの目的・ゴール</Label>
        <Textarea value={d.projectGoal} onChange={v => u("projectGoal", v)} placeholder="例：新商品スキンケアセットの販売促進。購入CVRを高めるLPを作りたい。" rows={3} />
      </div>
    </div>
  );
}

function Step2({ d, u }: { d: HearingData; u: (k: keyof HearingData, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>年齢層</Label>
          <select value={d.targetAge} onChange={e => u("targetAge", e.target.value)}
            className="w-full bg-[#0a0a18] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="">選択...</option>
            {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <Label>性別</Label>
          <select value={d.targetGender} onChange={e => u("targetGender", e.target.value)}
            className="w-full bg-[#0a0a18] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
            <option value="">選択...</option>
            <option value="女性">女性</option>
            <option value="男性">男性</option>
            <option value="性別問わず">性別問わず</option>
          </select>
        </div>
      </div>
      <div>
        <Label>職業・ライフスタイル</Label>
        <Input value={d.targetOccupation} onChange={v => u("targetOccupation", v)} placeholder="例：会社員、子育て中の主婦、フリーランス" />
      </div>
      <div>
        <Label>課題・ニーズ（何に困っているか）</Label>
        <Textarea value={d.targetNeeds} onChange={v => u("targetNeeds", v)} placeholder="例：敏感肌向けの安全なコスメを探している。成分表示が複雑でわかりにくい。" rows={3} />
      </div>
      <div>
        <Label>認知〜購買のカスタマージャーニー（任意）</Label>
        <Textarea value={d.customerJourney} onChange={v => u("customerJourney", v)} placeholder="例：SNS広告で認知 → 口コミ検索 → LP訪問 → 初回割引で購入" rows={3} />
      </div>
    </div>
  );
}

function Step3({ d, u }: { d: HearingData; u: (k: keyof HearingData, v: string) => void }) {
  const TONES = ["プロフェッショナル・信頼感", "フレンドリー・親しみやすい", "ラグジュアリー・高級感", "ポップ・明るい・楽しい", "クール・スタイリッシュ", "ナチュラル・温かみ", "革新的・テック感"];
  return (
    <div className="space-y-4">
      <div>
        <Label>USP・強み（箇条書きで入力）</Label>
        {(["strength1", "strength2", "strength3"] as const).map((k, i) => (
          <div key={k} className="flex items-center gap-2 mb-2">
            <span className="text-xs text-indigo-400 w-4 shrink-0">{i + 1}</span>
            <Input value={d[k]} onChange={v => u(k, v)} placeholder={["例：100%天然由来成分", "例：皮膚科医監修・低刺激設計", "例：30日間全額返金保証"][i]} />
          </div>
        ))}
      </div>
      <div>
        <Label>ブランドトーン・メッセージ</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {TONES.map(t => (
            <button key={t} onClick={() => u("brandMessage", d.brandMessage === t ? "" : t)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition ${
                d.brandMessage === t ? "border-indigo-500 bg-indigo-500/20 text-indigo-300" : "border-white/10 text-white/40 hover:border-white/30"
              }`}>{t}</button>
          ))}
        </div>
        <Input value={TONES.includes(d.brandMessage) ? "" : d.brandMessage} onChange={v => u("brandMessage", v)} placeholder="または自由記述..." />
      </div>
      <div>
        <Label>競合・同業他社サイト（URL）</Label>
        <Input value={d.competitors} onChange={v => u("competitors", v)} placeholder="https://competitor.com" />
      </div>
      <div>
        <Label>参考にしたいデザイン（URL）</Label>
        <Input value={d.referenceUrls} onChange={v => u("referenceUrls", v)} placeholder="https://reference.com" />
      </div>
    </div>
  );
}

function Step4({ d, u, toggleSection }: {
  d: HearingData;
  u: (k: keyof HearingData, v: string) => void;
  toggleSection: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>サイトタイプ</Label>
        <SelectPills options={SITE_TYPES} value={d.siteType} onChange={v => u("siteType", v)} />
      </div>
      <div>
        <Label>デザインスタイル</Label>
        <SelectPills options={STYLES} value={d.style} onChange={v => u("style", v)} />
      </div>
      <div>
        <Label>プライマリカラー</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {COLOR_PRESETS.map(c => (
            <button key={c.value} onClick={() => u("primaryColor", c.value)} title={c.label}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                d.primaryColor === c.value ? "border-white scale-110" : "border-transparent"
              }`} style={{ background: c.value }} />
          ))}
          <input type="color" value={d.primaryColor} onChange={e => u("primaryColor", e.target.value)}
            className="w-8 h-8 rounded-full cursor-pointer border border-white/20 bg-transparent" title="カスタム" />
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30">
          <div className="w-3 h-3 rounded" style={{ background: d.primaryColor }} />
          <span>{d.primaryColor}</span>
        </div>
      </div>
      <div>
        <Label>含めるセクション</Label>
        <div className="flex flex-wrap gap-1.5">
          {SECTIONS.map(s => (
            <button key={s.value} onClick={() => toggleSection(s.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                d.sections.includes(s.value)
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-white/10 bg-white/5 text-white/50 hover:border-white/30"
              }`}>{s.label}</button>
          ))}
        </div>
      </div>
      <div>
        <Label>アニメーション</Label>
        <div className="grid grid-cols-3 gap-2">
          {ANIMATION_LEVELS.map(a => (
            <button key={a.value} onClick={() => u("animation", a.value)}
              className={`p-2.5 rounded-lg border text-center transition ${
                d.animation === a.value
                  ? "border-indigo-500 bg-indigo-500/20 text-indigo-300"
                  : "border-white/10 bg-white/5 text-white/60 hover:border-white/30"
              }`}>
              <div className="font-semibold text-xs">{a.label}</div>
              <div className="text-[10px] text-white/40 mt-0.5">{a.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ヒアリングデータからプロンプトドラフトを自動生成
function buildPromptDraft(d: HearingData): string {
  const lines: string[] = [];

  // ビジネス概要
  const biz = [d.businessName, d.industry].filter(Boolean).join("（") + (d.industry ? "）" : "");
  if (biz) lines.push(`【ビジネス】${biz}`);
  if (d.projectGoal) lines.push(`【目標】${d.projectGoal}`);
  if (d.siteUrl) lines.push(`【既存URL】${d.siteUrl}`);

  // ターゲット
  const target = [d.targetAge, d.targetGender, d.targetOccupation].filter(Boolean).join(" / ");
  if (target) lines.push(`\n【ターゲット】${target}`);
  if (d.targetNeeds) lines.push(`【課題・ニーズ】${d.targetNeeds}`);
  if (d.customerJourney) lines.push(`【カスタマージャーニー】${d.customerJourney}`);

  // 強み
  const strengths = [d.strength1, d.strength2, d.strength3].filter(Boolean);
  if (strengths.length > 0) {
    lines.push(`\n【強み・USP】`);
    strengths.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }

  // ブランド
  if (d.brandMessage) lines.push(`\n【ブランドトーン】${d.brandMessage}`);
  if (d.competitors) lines.push(`【競合サイト】${d.competitors}`);
  if (d.referenceUrls) lines.push(`【参考デザイン】${d.referenceUrls}`);

  return lines.join("\n");
}

function Step5({ promptDraft, setPromptDraft, d }: {
  promptDraft: string;
  setPromptDraft: (v: string) => void;
  d: HearingData;
}) {
  const SECTION_LABELS: Record<string, string> = {
    nav: "ナビ", hero: "ヒーロー", features: "特徴", stats: "実績",
    pricing: "料金", testimonials: "お客様の声", faq: "FAQ",
    team: "チーム", contact: "お問い合わせ", footer: "フッター",
  };

  return (
    <div className="space-y-4">
      {/* デザイン設定サマリ */}
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 space-y-1 text-xs">
        <p className="text-indigo-300 font-semibold mb-2">生成設定</p>
        {[
          { label: "タイプ",       val: d.siteType },
          { label: "スタイル",     val: d.style },
          { label: "カラー",       val: d.primaryColor },
          { label: "アニメーション", val: d.animation },
          { label: "セクション",   val: d.sections.map(s => SECTION_LABELS[s] ?? s).join(" · ") },
        ].map(r => (
          <div key={r.label} className="flex gap-2 items-start">
            <span className="text-white/30 w-24 shrink-0">{r.label}</span>
            <span className="text-white/70">{r.val}</span>
          </div>
        ))}
      </div>

      {/* プロンプト確認・編集 */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <Label>AIへの指示（確認・編集できます）</Label>
          <button
            onClick={() => setPromptDraft(buildPromptDraft(d))}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
          >
            リセット
          </button>
        </div>
        <textarea
          value={promptDraft}
          onChange={e => setPromptDraft(e.target.value)}
          rows={14}
          className="w-full bg-white/5 border border-indigo-500/30 rounded-lg px-3 py-2.5 text-white text-xs font-mono placeholder-white/20 resize-none focus:outline-none focus:border-indigo-500 transition leading-relaxed"
          placeholder="ヒアリング内容が自動で入力されます..."
        />
        <p className="text-[11px] text-white/30 mt-1">
          この内容が AI に渡されます。自由に編集・追記できます。
        </p>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────

export default function WebDesignPage() {
  const [step, setStep] = useState(0); // 0〜4
  const [d, setD] = useState<HearingData>(INITIAL);
  const [promptDraft, setPromptDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [html, setHtml] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const update = useCallback((key: keyof HearingData, value: string) => {
    setD(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleSection = useCallback((val: string) => {
    setD(prev => ({
      ...prev,
      sections: prev.sections.includes(val)
        ? prev.sections.filter(s => s !== val)
        : [...prev.sections, val],
    }));
  }, []);

  const canNext = () => {
    if (step === 0) return d.businessName.trim().length > 0;
    return true;
  };

  const handleGenerate = useCallback(async () => {
    if (d.sections.length === 0) { setError("セクションを1つ以上選択してください"); return; }

    // Step5 で編集されたプロンプトドラフトを使用（未入力ならヒアリングから自動生成）
    const finalPrompt = promptDraft.trim() || buildPromptDraft(d) || d.businessName;

    setIsGenerating(true);
    setError("");

    try {
      const res = await fetch("/api/generate/webdesign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalPrompt,
          siteType: d.siteType,
          style: d.style,
          primaryColor: d.primaryColor,
          sections: d.sections,
          animation: d.animation,
          hearing: {
            businessName:    d.businessName,
            industry:        d.industry,
            targetAge:       d.targetAge,
            targetGender:    d.targetGender,
            targetOccupation: d.targetOccupation,
            targetNeeds:     d.targetNeeds,
            strength1:       d.strength1,
            strength2:       d.strength2,
            strength3:       d.strength3,
            competitors:     d.competitors,
            referenceUrls:   d.referenceUrls,
            brandTone:       d.brandMessage,
          },
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
  }, [d, promptDraft]);

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

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-6 h-6 text-indigo-400" />
          WEBデザイン生成
        </h1>
        <p className="text-gray-500 mt-1 text-sm">ヒアリングに沿って入力すると、精度の高いデザインを生成できます</p>
      </div>

      <div className="flex-1 grid lg:grid-cols-[360px_1fr] gap-6 min-h-0">
        {/* 左：ウィザードパネル */}
        <div className="flex flex-col min-h-0 bg-[#0f0f1e] rounded-xl border border-white/10 overflow-hidden">

          {/* ステップインジケーター */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-0">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => i < step || (i === step) ? setStep(i) : undefined}
                    className={`flex flex-col items-center gap-0.5 px-1 transition ${
                      i < step ? "opacity-60 hover:opacity-100 cursor-pointer" : i === step ? "opacity-100" : "opacity-25 cursor-default"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 transition ${
                      i < step ? "border-indigo-400 bg-indigo-400/20" : i === step ? "border-indigo-500 bg-indigo-500/30" : "border-white/20 bg-white/5"
                    }`}>
                      {i < step ? "✓" : s.icon}
                    </div>
                    <span className="text-[9px] text-white/60 hidden sm:block whitespace-nowrap">{s.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-px mx-1 transition ${i < step ? "bg-indigo-400/50" : "bg-white/10"}`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/30 mt-2">
              {step + 1} / {STEPS.length} — {STEPS[step].label}
            </p>
          </div>

          {/* ステップ本文 */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {step === 0 && <Step1 d={d} u={update} />}
            {step === 1 && <Step2 d={d} u={update} />}
            {step === 2 && <Step3 d={d} u={update} />}
            {step === 3 && <Step4 d={d} u={update} toggleSection={toggleSection} />}
            {step === 4 && <Step5 promptDraft={promptDraft} setPromptDraft={setPromptDraft} d={d} />}

            {error && (
              <div className={`mt-4 text-sm px-4 py-3 rounded-lg border ${
                error.includes("STITCH_API_KEY")
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {error.includes("STITCH_API_KEY") ? (
                  <div className="space-y-2">
                    <p className="font-semibold">Stitch APIキーが未設定です</p>
                    <ol className="text-xs space-y-1 text-amber-200/80 list-decimal list-inside">
                      <li>stitch.withgoogle.com を開く</li>
                      <li>右上アカウント → Settings → API Keys</li>
                      <li>「Create API Key」でキーを生成</li>
                      <li>Vercel → Settings → Environment Variables に<br />
                        <code className="bg-amber-500/20 px-1 rounded">STITCH_API_KEY</code> を追加して再デプロイ</li>
                      <li>ローカルの場合は <code className="bg-amber-500/20 px-1 rounded">.env.local</code> に追加</li>
                    </ol>
                  </div>
                ) : (
                  error
                )}
              </div>
            )}
          </div>

          {/* ナビゲーションボタン */}
          <div className="shrink-0 px-4 pb-4 pt-3 border-t border-white/10 flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-sm font-medium transition"
              >
                <ChevronLeft className="w-4 h-4" />
                戻る
              </button>
            )}
            <div className="flex-1" />
            {step < STEPS.length - 1 ? (
              <button
                onClick={() => {
                  const next = step + 1;
                  // Step5（index 4）に入るタイミングでプロンプトを自動生成
                  if (next === 4) setPromptDraft(buildPromptDraft(d));
                  setStep(next);
                }}
                disabled={!canNext()}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition"
              >
                次へ
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition shadow-lg"
              >
                <Wand2 className="w-4 h-4" />
                {isGenerating ? "生成中..." : "WEBデザインを生成する"}
              </button>
            )}
          </div>
        </div>

        {/* 右：プレビュー */}
        <div className="flex flex-col min-h-0 gap-3">
          {html && (
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <div className="flex bg-[#0f0f1e] border border-white/10 rounded-lg p-1 gap-1">
                {([
                  { mode: "desktop" as const, icon: Monitor,    label: "PC" },
                  { mode: "mobile"  as const, icon: Smartphone, label: "モバイル" },
                  { mode: "code"    as const, icon: Code2,       label: "コード" },
                ] as const).map(({ mode, icon: Icon, label }) => (
                  <button key={mode} onClick={() => setPreviewMode(mode)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      previewMode === mode ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <button onClick={handleGenerate} disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-medium transition">
                <RefreshCw className="w-3.5 h-3.5" />
                再生成
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white rounded-lg text-xs font-medium transition">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "コピー済み" : "HTMLをコピー"}
              </button>
              <button onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-medium transition">
                <FileText className="w-3.5 h-3.5" />
                PDF
              </button>
              <button onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition">
                <Download className="w-3.5 h-3.5" />
                HTML
              </button>
            </div>
          )}

          <div className="flex-1 min-h-0 rounded-xl overflow-hidden border border-white/10 bg-gray-100">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#0f0f1e]">
                <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                <div className="text-center">
                  <p className="font-medium text-white">Stitch がデザインを生成中...</p>
                  <p className="text-sm text-white/40 mt-1">ヒアリング情報を元に最適化しています（30〜60秒）</p>
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
                  <img src={imageUrl} alt="generated design" className="w-full object-contain object-top" />
                </div>
              ) : (
                <div className={`h-full flex items-start justify-center bg-gray-200 overflow-auto ${previewMode === "mobile" ? "py-4" : ""}`}>
                  <iframe
                    ref={iframeRef}
                    srcDoc={html}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                    className={`bg-white shadow-2xl ${
                      previewMode === "mobile" ? "w-[390px] h-[844px] rounded-3xl" : "w-full h-full"
                    }`}
                    title="WEBデザインプレビュー"
                  />
                </div>
              )
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-4 bg-[#0f0f1e]">
                <Globe className="w-12 h-12 text-white/10" />
                <div className="text-center">
                  <p className="font-medium text-white/40">生成されたWEBデザインがここに表示されます</p>
                  <p className="text-sm text-white/25 mt-1">左のウィザードでヒアリングを進めてください</p>
                </div>
                {/* ステップガイド */}
                <div className="flex flex-col gap-2 mt-2">
                  {STEPS.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 text-xs transition ${i <= step ? "text-white/50" : "text-white/20"}`}>
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm border ${
                        i < step ? "border-indigo-400 text-indigo-400" : i === step ? "border-white/40 text-white/60" : "border-white/10"
                      }`}>{i < step ? "✓" : i + 1}</span>
                      {s.icon} {s.label}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
