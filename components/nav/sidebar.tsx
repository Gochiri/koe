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
    <aside className="w-52 flex-shrink-0 border-r border-white/[0.06] bg-sidebar flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight">Focus OS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-2 mb-2">
          Menu
        </p>
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
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
              )}
              <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-primary" : "")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/[0.06]">
        <p className="text-[10px] text-muted-foreground/40 text-center">v1.0</p>
      </div>
    </aside>
  );
}
