"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";

export function Header() {
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
      <div />
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          onClick={handleSignOut}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="ログアウト"
        >
          <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </header>
  );
}
