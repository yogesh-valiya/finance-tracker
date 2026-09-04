"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [rangePreset, setRangePreset] = React.useState<"all" | "year" | "month" | "custom">("all");
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [isExporting, setIsExporting] = React.useState(false);
  const [error, setError] = React.useState("");

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError("");

      const payload: any = { format: "csv" };
      const now = new Date();

      if (rangePreset === "year") {
        payload.startDate = new Date(Date.UTC(now.getFullYear(), 0, 1)).toISOString();
        payload.endDate = new Date(Date.UTC(now.getFullYear(), 11, 31, 23, 59, 59)).toISOString();
      } else if (rangePreset === "month") {
        payload.startDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)).toISOString();
        payload.endDate = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)).toISOString();
      } else if (rangePreset === "custom") {
        if (!startDate || !endDate) {
          setError("Please select both start and end dates");
          setIsExporting(false);
          return;
        }
        payload.startDate = new Date(startDate).toISOString();
        payload.endDate = new Date(endDate).toISOString();
      }

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Export request failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `finance-tracker-${rangePreset}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            Export Data
          </DialogTitle>
          <DialogDescription className="text-xs">
            Download your financial transactions and accounts in CSV format for Excel or Google Sheets.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {error && (
            <div className="p-2.5 rounded-md bg-destructive/10 text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Date Range</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "all", label: "All Time" },
                { id: "year", label: "This Year" },
                { id: "month", label: "This Month" },
                { id: "custom", label: "Custom Range" },
              ].map((item) => (
                <Button
                  key={item.id}
                  type="button"
                  variant={rangePreset === item.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRangePreset(item.id as any)}
                  className="h-8 text-xs font-medium"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>

          {rangePreset === "custom" && (
            <div className="grid grid-cols-2 gap-2 animate-in fade-in-50">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isExporting}
              onClick={handleExport}
              className="h-8 text-xs gap-1.5"
            >
              {isExporting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Download CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
