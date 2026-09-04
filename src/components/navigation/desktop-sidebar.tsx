"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  PieChart,
  Wallet,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/providers/auth-provider";

const NAV_ITEMS = [
  {
    label: "Transactions",
    shortLabel: "Trans.",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Analytics",
    shortLabel: "Stats",
    href: "/stats",
    icon: PieChart,
  },
  {
    label: "Accounts & Net Worth",
    shortLabel: "Accounts",
    href: "/accounts",
    icon: Wallet,
  },
  {
    label: "Settings & Preferences",
    shortLabel: "More",
    href: "/more",
    icon: Menu,
  },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen sticky top-0 bg-card border-r border-border transition-all duration-300 z-30 shrink-0 select-none",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
              ₹
            </div>
            <span className="font-bold text-base tracking-tight truncate text-foreground">
              Finance Tracker
            </span>
          </div>
        )}
        {isCollapsed && (
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm mx-auto shrink-0">
            ₹
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn("size-8 text-muted-foreground", isCollapsed && "hidden")}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-y-auto">
        <TooltipProvider delay={100}>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/transactions" && pathname.startsWith(item.href));
            const Icon = item.icon;

            const linkElement = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger render={linkElement} />
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.href}>{linkElement}</div>;
          })}
        </TooltipProvider>
      </div>

      {/* Expand Button for Collapsed Mode */}
      {isCollapsed && (
        <div className="p-2 flex justify-center border-t border-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="size-8 text-muted-foreground"
            title="Expand sidebar"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="p-3 border-t border-border bg-card/50">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-auto p-1.5 flex items-center gap-3 hover:bg-muted justify-start",
                  isCollapsed && "justify-center p-1"
                )}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || "User"} />
                  <AvatarFallback className="text-xs bg-muted text-foreground font-medium">
                    {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : <UserIcon className="size-4" />}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <div className="flex flex-col text-left overflow-hidden">
                    <span className="text-xs font-semibold truncate text-foreground">
                      {user?.displayName || user?.email?.split("@")[0] || "Financial User"}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate">
                      {user?.email || "Signed In"}
                    </span>
                  </div>
                )}
              </Button>
            }
          />
          <DropdownMenuContent align={isCollapsed ? "center" : "end"} className="w-56" side="top">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold">{user?.displayName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              render={
                <Link href="/more" className="flex items-center gap-2 cursor-pointer w-full">
                  <Menu className="size-4 mr-2" data-icon="inline-start" />
                  Settings & Preferences
                </Link>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
            >
              <LogOut className="size-4 mr-2" data-icon="inline-start" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
