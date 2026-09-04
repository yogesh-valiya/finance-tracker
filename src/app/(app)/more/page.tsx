"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportDialog } from "@/components/settings/export-dialog";
import {
  Sliders,
  Wallet,
  ShieldCheck,
  FolderTree,
  Repeat,
  FileSpreadsheet,
  Calculator,
  CloudBackup,
  HelpCircle,
  LogOut,
  ChevronRight,
  User as UserIcon,
  Menu,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function MorePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [exportOpen, setExportOpen] = React.useState(false);
  const [baseCurrency, setBaseCurrency] = React.useState("INR");

  React.useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings?.baseCurrency) {
          setBaseCurrency(data.settings.baseCurrency);
        }
      })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await logout();
  };

  const GRID_ITEMS = [
    {
      title: "Configuration",
      description: "Preferences, currency, start dates, colors",
      href: "/more/configuration",
      icon: Sliders,
      badge: null,
    },
    {
      title: "Accounts",
      description: "Net worth, 11 asset & liability groups",
      href: "/accounts",
      icon: Wallet,
      badge: null,
    },
    {
      title: "Passcode Lock",
      description: "4-digit PIN & biometric resume lock",
      href: "/more/passcode",
      icon: ShieldCheck,
      badge: null,
    },
    {
      title: "Categories",
      description: "Income & expense hierarchy, icons",
      href: "/more/categories",
      icon: FolderTree,
      badge: null,
    },
    {
      title: "Repeat Setting",
      description: "Recurring rules with 14 frequencies",
      href: "/more/recurring",
      icon: Repeat,
      badge: null,
    },
    {
      title: "Export Data",
      description: "Download statements in CSV for Excel",
      action: () => setExportOpen(true),
      icon: FileSpreadsheet,
      badge: "CSV",
    },
    {
      title: "CalcBox",
      description: "Financial math & minor-unit calculation",
      href: null,
      icon: Calculator,
      badge: "Tools",
    },
    {
      title: "Backup & Sync",
      description: "Cloud snapshot & database backup",
      href: null,
      icon: CloudBackup,
      badge: "Self-Hosted",
    },
    {
      title: "Help & Feedback",
      description: "Documentation, shortcuts, and support",
      href: null,
      icon: HelpCircle,
      badge: null,
    },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* Top Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Menu className="size-6 text-primary" />
          Settings & Hub
        </h1>
        <p className="text-sm text-muted-foreground">
          System configuration, classification hierarchies, recurring schedules, and security
        </p>
      </div>

      {/* User Profile Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="size-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-base text-foreground">
                  {user?.displayName || user?.email?.split("@")[0] || "Authenticated User"}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider">
                  Base: {baseCurrency}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{user?.email || "Local User"}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-xs gap-1.5 h-9 text-muted-foreground hover:text-destructive hover:border-destructive/40 self-start sm:self-auto"
          >
            <LogOut className="size-3.5" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* 3x3 Navigation Grid */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Management & Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {GRID_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const content = (
              <Card
                className={cn(
                  "border-border transition-all h-full flex flex-col justify-between",
                  item.href || item.action
                    ? "hover:bg-muted/30 cursor-pointer hover:border-primary/40 shadow-xs"
                    : "opacity-70 bg-muted/10 cursor-default"
                )}
                onClick={item.action}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                  <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="size-4.5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                        {item.badge}
                      </Badge>
                    )}
                    {(item.href || item.action) && (
                      <ChevronRight className="size-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <CardTitle className="text-sm font-semibold text-foreground">
                    {item.title}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5 line-clamp-2">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );

            if (item.href) {
              return (
                <Link key={idx} href={item.href}>
                  {content}
                </Link>
              );
            }

            return <div key={idx}>{content}</div>;
          })}
        </div>
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
