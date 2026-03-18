"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wand2,
  Eraser,
  Crop,
  History,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/generate", label: "バナー生成", icon: Wand2 },
  { href: "/edit/remove-bg", label: "背景除去", icon: Eraser },
  { href: "/edit/crop", label: "切り抜き", icon: Crop },
  { href: "/history", label: "生成履歴", icon: History },
  { href: "/settings", label: "設定", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#1A1A2E] text-white flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-yellow-400" />
          <span className="font-bold text-lg">BannerForge Pro</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition",
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
