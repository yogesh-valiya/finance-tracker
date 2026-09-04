"use client";

import * as React from "react";
import Link from "next/link";
import { UserSettings } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Sliders,
  Check,
  Loader2,
  DollarSign,
  Calendar,
  Layers,
  Palette,
  Clock,
  Sparkles,
  ChevronRight,
  FolderTree,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
  { code: "SGD", symbol: "$", name: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

export default function ConfigurationPage() {
  const [settings, setSettings] = React.useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [savingField, setSavingField] = React.useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const fetchSettings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updatePreference = async (key: keyof UserSettings, value: any) => {
    if (!settings) return;
    setSavingField(key as string);
    setSaveSuccess(false);

    // Optimistic update
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error(`Failed to update ${String(key)}:`, err);
      fetchSettings();
    } finally {
      setSavingField(null);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-16 text-muted-foreground">
        <Loader2 className="size-6 animate-spin mr-2" />
        <span>Loading preferences...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Link href="/more" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sliders className="size-5 text-primary" />
              Configuration & Preferences
            </h1>
            <p className="text-xs text-muted-foreground">
              Customize financial rules, calendar starts, layout, and entry behavior
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-in fade-in">
            <Check className="size-3.5" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {/* Shortcuts */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/more/categories">
          <Card className="border-border hover:bg-muted/30 transition-colors cursor-pointer">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="size-4 text-primary" />
                <span className="text-xs font-semibold">Category Settings</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/more/recurring">
          <Card className="border-border hover:bg-muted/30 transition-colors cursor-pointer">
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Repeat className="size-4 text-primary" />
                <span className="text-xs font-semibold">Repeat Schedules</span>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Currency Settings */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="size-4 text-primary" />
            Currency & Minor Units
          </CardTitle>
          <CardDescription className="text-xs">
            Primary currency for account ledgers, balances, and calculations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Main Base Currency</Label>
              <Select
                value={settings.baseCurrency}
                onValueChange={(val) => val && updatePreference("baseCurrency", val)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-xs">
                      {c.symbol} — {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Secondary Sub-Currency (Optional)</Label>
              <Input
                type="text"
                placeholder="e.g. USD"
                value={settings.subCurrency || ""}
                onChange={(e) => updatePreference("subCurrency", e.target.value.trim() || null)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar & Accounting Cycles */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="size-4 text-primary" />
            Calendar & Accounting Cycle
          </CardTitle>
          <CardDescription className="text-xs">
            Cycle start dates, initial start screen, and balance carry-over rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Screen</Label>
              <Select
                value={settings.startScreen}
                onValueChange={(val) => val && updatePreference("startScreen", val)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select start screen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY" className="text-xs">Daily Feed (Default)</SelectItem>
                  <SelectItem value="CALENDAR" className="text-xs">Calendar Grid View</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Weekly Start Day</Label>
              <Select
                value={settings.weeklyStartDay}
                onValueChange={(val) => val && updatePreference("weeklyStartDay", val)}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select weekly start day" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONDAY" className="text-xs">Monday</SelectItem>
                  <SelectItem value="SUNDAY" className="text-xs">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
            <div className="space-y-1.5">
              <Label className="text-xs">Monthly Start Date (1–28)</Label>
              <Input
                type="number"
                min={1}
                max={28}
                value={settings.monthlyStartDate}
                onChange={(e) =>
                  updatePreference("monthlyStartDate", Math.max(1, Math.min(28, parseInt(e.target.value || "1", 10))))
                }
                className="h-9 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">
                Accounting month rollover date (e.g. 1st or salary day 25th)
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <Label className="text-xs">Carry-Over Setting</Label>
                <p className="text-[10px] text-muted-foreground">
                  Carry over net positive balance to next month
                </p>
              </div>
              <Switch
                checked={settings.carryOver}
                onCheckedChange={(checked) => updatePreference("carryOver", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visual & Color Themes */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Palette className="size-4 text-primary" />
            Visual Style & Theme Accents
          </CardTitle>
          <CardDescription className="text-xs">
            Income and expense semantic color scheme accents (§9.3).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => updatePreference("colorScheme", "SET_A")}
              className={cn(
                "p-3 rounded-xl border text-left flex flex-col gap-2 transition-all",
                settings.colorScheme === "SET_A"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/30"
              )}
            >
              <div className="text-xs font-semibold">Set A (Standard)</div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-blue-600 font-medium">Income Blue</span>
                <span>•</span>
                <span className="text-rose-600 font-medium">Expense Red</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updatePreference("colorScheme", "SET_B")}
              className={cn(
                "p-3 rounded-xl border text-left flex flex-col gap-2 transition-all",
                settings.colorScheme === "SET_B"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:bg-muted/30"
              )}
            >
              <div className="text-xs font-semibold">Set B (Alternative)</div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-emerald-600 font-medium">Income Green</span>
                <span>•</span>
                <span className="text-rose-600 font-medium">Expense Red</span>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Input & Form Behavior */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Entry & Interaction Flow
          </CardTitle>
          <CardDescription className="text-xs">
            Optimizations for quick financial entry and swipe navigation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-foreground">Swipe Gesture</div>
              <div className="text-[11px] text-muted-foreground">
                Horizontal swipe action on feed pages
              </div>
            </div>
            <Select
              value={settings.swipeGesture}
              onValueChange={(val) => val && updatePreference("swipeGesture", val)}
            >
              <SelectTrigger className="h-8 w-[210px] text-xs">
                <SelectValue placeholder="Select gesture" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CHANGE_DATE" className="text-xs">Change Period (Month/Day)</SelectItem>
                <SelectItem value="CHANGE_TAB" className="text-xs">Switch Feed View</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="text-xs font-medium text-foreground">Time Input Mode</div>
              <div className="text-[11px] text-muted-foreground">
                Auto-stamp current timestamp or prompt for manual time
              </div>
            </div>
            <Select
              value={settings.timeInput}
              onValueChange={(val) => val && updatePreference("timeInput", val)}
            >
              <SelectTrigger className="h-8 w-[210px] text-xs">
                <SelectValue placeholder="Select time input mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AUTO_STAMP" className="text-xs">Auto-Stamp Current Time</SelectItem>
                <SelectItem value="MANUAL" className="text-xs">Manual Time Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="text-xs font-medium text-foreground">Input Sequence Order</div>
              <div className="text-[11px] text-muted-foreground">
                Focus amount first or category picker first on new transaction
              </div>
            </div>
            <Select
              value={settings.inputOrder}
              onValueChange={(val) => val && updatePreference("inputOrder", val)}
            >
              <SelectTrigger className="h-8 w-[180px] text-xs">
                <SelectValue placeholder="Select input sequence" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FROM_AMOUNT" className="text-xs">From Amount</SelectItem>
                <SelectItem value="FROM_CATEGORY" className="text-xs">From Category</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="text-xs font-medium text-foreground">Show Description Field</div>
              <div className="text-[11px] text-muted-foreground">
                Display separate memo/description line in entry dialog
              </div>
            </div>
            <Switch
              checked={settings.showDescription}
              onCheckedChange={(checked) => updatePreference("showDescription", checked)}
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <div className="text-xs font-medium text-foreground">Note Autocomplete</div>
              <div className="text-[11px] text-muted-foreground">
                Suggest recent notes while typing transaction note
              </div>
            </div>
            <Switch
              checked={settings.autocomplete}
              onCheckedChange={(checked) => updatePreference("autocomplete", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
