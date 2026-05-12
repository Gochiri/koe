"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Sun,
  TrendingUp,
  Lightbulb,
  Archive,
  PenLine,
  Layers,
  LayoutGrid,
  Sparkles,
  Package,
  Users,
  GraduationCap,
} from "lucide-react";

const sections = [
  {
    items: [{ href: "/vault", label: "Home", icon: Home }],
  },
  {
    heading: "DIARIO",
    items: [
      { href: "/routine", label: "Mi Día", icon: Sun },
      { href: "/koes-law", label: "Ingresos", icon: TrendingUp },
      { href: "/notes", label: "Ideas", icon: Lightbulb },
      { href: "/vault", label: "Vault", icon: Archive },
    ],
  },
  {
    heading: "CREAR",
    items: [
      { href: "/writing", label: "Escribir", icon: PenLine },
      { href: "/content", label: "Contenido", icon: Layers },
      { href: "/trust", label: "Tipos de Contenido", icon: LayoutGrid },
    ],
  },
  {
    heading: "NEGOCIO",
    items: [
      { href: "/one-person", label: "Visión", icon: Sparkles },
      { href: "/offers", label: "Ofertas", icon: Package },
      { href: "/mvo", label: "Ventas", icon: Users },
      { href: "/skills", label: "Skills", icon: GraduationCap },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 flex-shrink-0 border-r border-border bg-sidebar flex flex-col h-full">
      <div className="p-4 border-b border-border/60">
        <span className="font-semibold text-sm tracking-tight">Dan Koe OS</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.heading && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {section.heading}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/vault" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={`${si}-${item.href}`}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
