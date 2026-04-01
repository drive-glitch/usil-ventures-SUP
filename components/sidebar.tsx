"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "📊 Dashboard" },
  { href: "/startups",  label: "🚀 Startups"  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-52 shrink-0 bg-[#1a1a18] h-full">
      <div className="flex items-center h-14 px-5 border-b border-[#2a2a28]">
        <span className="font-bold text-white text-sm tracking-tight leading-tight">
          USIL Ventures
        </span>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "bg-[#2a2a28] text-white"
                : "text-[#aaa] hover:bg-[#2a2a28] hover:text-white"
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-[#2a2a28]">
        <p className="text-[10px] text-[#555] uppercase tracking-wider font-bold">
          Interno · USIL Ventures
        </p>
      </div>
    </aside>
  );
}
