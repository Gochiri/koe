"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Target, BookOpen, Timer, Zap } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/goals",     label: "Goals",     icon: Target },
  { href: "/eden",      label: "Eden",      icon: BookOpen },
  { href: "/focus",     label: "Focus",     icon: Timer },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[196px] flex-shrink-0 border-r border-white/[0.06] bg-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-[18px] border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-foreground/8 border border-white/[0.08] flex items-center justify-center">
            <Zap className="w-3 h-3 text-foreground/70" />
          </div>
          <span className="font-semibold text-[13px] tracking-tight text-foreground/90">Focus OS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5 space-y-px">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            pathname.startsWith(item.href + "?") ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors duration-100",
                active
                  ? "bg-foreground/[0.07] text-foreground font-medium"
                  : "text-foreground/40 hover:bg-foreground/[0.04] hover:text-foreground/70"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] bg-foreground/60 rounded-r-full" />
              )}
              <Icon className="w-[15px] h-[15px] flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
