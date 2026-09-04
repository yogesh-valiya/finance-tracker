"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, PieChart, Wallet, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Trans.",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Stats",
    href: "/stats",
    icon: PieChart,
  },
  {
    label: "Accounts",
    href: "/accounts",
    icon: Wallet,
  },
  {
    label: "More",
    href: "/more",
    icon: Menu,
  },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border md:hidden pb-[env(safe-area-inset-bottom,0px)]">
      <div className="grid grid-cols-4 h-14">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/transactions" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors min-h-[44px] touch-manipulation",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("size-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[11px] leading-none tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
