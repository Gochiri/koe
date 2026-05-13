"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Target, BookOpen, Timer, Zap, ChevronLeft, ChevronRight, CheckSquare } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Inicio",   icon: LayoutDashboard },
  { href: "/tasks",     label: "Tareas",   icon: CheckSquare },
  { href: "/goals",     label: "Metas",    icon: Target },
  { href: "/eden",      label: "Eden",     icon: BookOpen },
  { href: "/focus",     label: "Enfoque",  icon: Timer },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Read persisted state after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  function toggle() {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }

  // Prevent flash before localStorage is read
  const width = !mounted ? "w-[196px]" : collapsed ? "w-[52px]" : "w-[196px]";

  return (
    <aside
      className={cn(
        "flex-shrink-0 border-r border-white/[0.06] bg-sidebar flex flex-col h-full overflow-hidden",
        "transition-[width] duration-200 ease-in-out",
        width
      )}
    >
      {/* Logo */}
      <div className="px-3 py-[18px] border-b border-white/[0.06] flex items-center">
        <div className="w-6 h-6 rounded-md bg-foreground/8 border border-white/[0.08] flex items-center justify-center flex-shrink-0">
          <Zap className="w-3 h-3 text-foreground/70" />
        </div>
        {!collapsed && (
          <span className="ml-2.5 font-semibold text-[13px] tracking-tight text-foreground/90 whitespace-nowrap overflow-hidden">
            Focus OS
          </span>

        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-px">
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
              title={collapsed ? item.label : undefined}
              className={cn(
                "relative flex items-center rounded-md px-2 py-2 text-[13px] transition-colors duration-100",
                collapsed ? "justify-center" : "gap-2.5",
                active
                  ? "bg-foreground/[0.07] text-foreground font-medium"
                  : "text-foreground/40 hover:bg-foreground/[0.04] hover:text-foreground/70"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-[18px] bg-foreground/60 rounded-r-full" />
              )}
              <Icon className="w-[15px] h-[15px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Toggle button */}
      <div className="px-2 pb-4 border-t border-white/[0.06] pt-3">
        <button
          onClick={toggle}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "w-full flex items-center rounded-md px-2 py-2 text-foreground/30 hover:bg-foreground/[0.04] hover:text-foreground/60 transition-colors",
            collapsed ? "justify-center" : "gap-2.5"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-[14px] h-[14px]" />
          ) : (
            <>
              <ChevronLeft className="w-[14px] h-[14px]" />
              <span className="text-[12px]">Colapsar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
