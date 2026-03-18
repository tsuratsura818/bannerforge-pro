import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id ?? "")
    .single();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">設定</h1>
        <p className="text-gray-500 mt-1">アカウントと利用状況の管理</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">アカウント情報</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              メールアドレス
            </label>
            <p className="text-gray-900 dark:text-white mt-0.5">{user?.email}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              プラン
            </label>
            <p className="text-gray-900 dark:text-white mt-0.5 capitalize">
              {profile?.plan ?? "free"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">今月の利用状況</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">生成回数</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {profile?.used_this_month ?? 0} / {profile?.monthly_quota ?? 10} 回
          </span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1A1A2E] dark:bg-blue-500 rounded-full"
            style={{
              width: profile
                ? `${Math.min((profile.used_this_month / profile.monthly_quota) * 100, 100)}%`
                : "0%",
            }}
          />
        </div>
        <p className="text-xs text-gray-400">
          クォータリセット:{" "}
          {profile?.quota_reset_at
            ? new Date(profile.quota_reset_at).toLocaleDateString("ja-JP")
            : "-"}
        </p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm text-amber-700 dark:text-amber-300">
          APIキーの設定は環境変数 <code className="font-mono">.env.local</code> で管理されています。
        </p>
      </div>
    </div>
  );
}
