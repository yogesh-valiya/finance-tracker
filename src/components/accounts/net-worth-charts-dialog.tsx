"use client";

import * as React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";

interface NetWorthPoint {
  month: string;
  netWorth: number;
  assets: number;
  liabilities: number;
  income: number;
  expenses: number;
}

interface NetWorthChartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year?: number;
}

export function NetWorthChartsDialog({
  open,
  onOpenChange,
  year = new Date().getFullYear(),
}: NetWorthChartsDialogProps) {
  const [data, setData] = React.useState<NetWorthPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;

    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/analytics/net-worth?year=${year}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.trajectory || []);
        }
      } catch (err) {
        console.error("Failed to load net worth analytics:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [open, year]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            Net Worth & Cashflow Analytics ({year})
          </DialogTitle>
          <DialogDescription className="text-xs">
            12-month net worth trajectory and monthly comparative cashflow
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3">
            <Loader2 className="size-7 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Calculating net worth trajectory...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-2">
            {/* 1. Net Worth Trajectory Chart */}
            <Card className="border-border">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                  Net Worth Trajectory
                </CardTitle>
                <CardDescription className="text-xs">
                  Net balance (Assets − Liabilities) over time
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload as NetWorthPoint;
                            return (
                              <div className="bg-popover border border-border p-2.5 rounded-lg shadow-sm text-xs flex flex-col gap-1">
                                <span className="font-semibold text-foreground">{item.month}</span>
                                <div className="flex justify-between gap-3 font-bold text-primary">
                                  <span>Net Worth:</span>
                                  <span className="tabular-nums">{formatCurrency(item.netWorth)}</span>
                                </div>
                                <div className="flex justify-between gap-3 text-muted-foreground text-[11px]">
                                  <span>Assets:</span>
                                  <span className="tabular-nums">{formatCurrency(item.assets)}</span>
                                </div>
                                <div className="flex justify-between gap-3 text-muted-foreground text-[11px]">
                                  <span>Liabilities:</span>
                                  <span className="tabular-nums">{formatCurrency(item.liabilities)}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="netWorth"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        dot={{ r: 3.5, fill: "var(--primary)" }}
                        activeDot={{ r: 5.5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 2. Monthly Comparative Cashflow */}
            <Card className="border-border">
              <CardHeader className="pb-1">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider">
                  Monthly Comparative Cashflow
                </CardTitle>
                <CardDescription className="text-xs">
                  Total Income (blue) vs Expenses (red) per month
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="w-full h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                        tickFormatter={(v) => (Math.abs(v) >= 1000 ? `${v / 1000}k` : v)}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload as NetWorthPoint;
                            return (
                              <div className="bg-popover border border-border p-2 rounded-lg shadow-sm text-xs flex flex-col gap-1">
                                <span className="font-semibold text-foreground">{item.month}</span>
                                <div className="flex items-center justify-between gap-3 text-income">
                                  <span>Income:</span>
                                  <span className="font-bold tabular-nums">+{formatCurrency(item.income)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 text-expense">
                                  <span>Expenses:</span>
                                  <span className="font-bold tabular-nums">-{formatCurrency(item.expenses)}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                      <Bar dataKey="income" name="Income" fill="var(--income)" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expenses" name="Expenses" fill="var(--expense)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
