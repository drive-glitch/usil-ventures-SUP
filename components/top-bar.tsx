"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function TopBar() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-border bg-white shrink-0">
      <div className="md:hidden font-bold text-foreground tracking-tight text-sm">
        USIL Ventures
      </div>
      <div className="flex-1" />
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#1a1a18] transition-colors px-3 py-1.5 rounded-md hover:bg-[#F3F4F6]"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Cerrar sesión</span>
      </button>
    </header>
  );
}
