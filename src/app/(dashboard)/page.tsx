import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { Wand2, Eraser, Crop, TrendingUp } from "lucide-react";
import Image from "next/image";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: recentGenerations } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single();

  const usedPercent = profile
    ? Math.round((profile.used_this_month / profile.monthly_quota) * 100)
    : 0;

  const quickActions = [
    { href: "/generate", label: "バナー作成", description: "AIでバナーを生成", icon: Wand2, color: "bg-purple-500" },
    { href: "/edit/remove-bg", label: "背景除去", description: "商品画像の背景を除去", icon: Eraser, color: "bg-blue-500" },
    { href: "/edit/crop", label: "切り抜き", description: "画像をトリミング", icon: Crop, color: "bg-green-500" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          ダッシュボード
        </h1>
        <p className="text-gray-500 mt-1">ようこそ、{user?.email}</p>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-3 gap-4">
        {quickActions.map(({ href, label, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 hover:border-[#1A1A2E] dark:hover:border-gray-600 transition group"
          >
            <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[#1A1A2E] dark:group-hover:text-blue-400 transition">
              {label}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          </Link>
        ))}
      </div>

      {/* 利用量 */}
      {profile && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#1A1A2E] dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">今月の利用量</h3>
            </div>
            <span className="text-sm text-gray-500">
              {profile.used_this_month} / {profile.monthly_quota} 回
            </span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1A1A2E] dark:bg-blue-500 rounded-full transition-all"
              style={{ width: `${Math.min(usedPercent, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">{usedPercent}% 使用済み</p>
        </div>
      )}

      {/* 最近の生成画像 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">最近の生成画像</h2>
          <Link href="/history" className="text-sm text-[#1A1A2E] dark:text-blue-400 hover:underline">
            すべて見る
          </Link>
        </div>

        {!recentGenerations || recentGenerations.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-400">まだ画像がありません</p>
            <Link href="/generate" className="mt-3 inline-block text-sm text-[#1A1A2E] dark:text-blue-400 hover:underline">
              最初のバナーを作成する →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {recentGenerations.map((gen) => (
              <div key={gen.id} className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800">
                {gen.output_images?.[0] && (
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                    <Image
                      src={gen.output_images[0]}
                      alt="Generated"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 33vw, 25vw"
                    />
                  </div>
                )}
                <div className="p-3">
                  <p className="text-xs text-gray-500 truncate">{gen.prompt}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(gen.created_at).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
