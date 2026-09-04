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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface AccountPerformanceChartProps {
  accountId: string;
  accountName: string;
}

interface MonthlyStat {
  month: string;
  credits: number;
  debits: number;
  balance: number;
}

export function AccountPerformanceChart({
  accountId,
  accountName,
}: AccountPerformanceChartProps) {
  const [data, setData] = React.useState<MonthlyStat[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/accounts/${accountId}/transactions?period=annually&year=2026`);
        if (res.ok) {
          const json = await res.json();
          // Group by month
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const monthlyMap: Record<number, { credits: number; debits: number; lastBalance: number }> = {};

          for (let m = 0; m < 12; m++) {
            monthlyMap[m] = { credits: 0, debits: 0, lastBalance: json.summary.startingBalance };
          }

          // Transactions come newest first in JSON
          const chronological = [...json.transactions].reverse();
          let currentBal = json.summary.startingBalance;

          chronological.forEach((tx) => {
            const m = new Date(tx.date).getMonth();
            if (tx.isCredit) {
              monthlyMap[m].credits += Math.abs(tx.delta);
            } else {
              monthlyMap[m].debits += Math.abs(tx.delta);
            }
            currentBal = tx.runningBalance;
            monthlyMap[m].lastBalance = currentBal;
          });

          const stats = monthNames.map((name, idx) => ({
            month: name,
            credits: monthlyMap[idx].credits,
            debits: monthlyMap[idx].debits,
            balance: monthlyMap[idx].lastBalance,
          }));

          setData(stats);
        }
      } catch (err) {
        console.error("Failed to load performance stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, [accountId]);

  const formatCurrency = (val: number) => `₹${val.toLocaleString("en-IN")}`;

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        Loading performance charts...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Balance Trajectory */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider">
            Balance Trajectory (2026)
          </CardTitle>
          <CardDescription className="text-xs">
            Running cumulative balance across months
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
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
                      const item = payload[0].payload as MonthlyStat;
                      return (
                        <div className="bg-popover border border-border px-2.5 py-1.5 rounded-lg shadow-sm text-xs">
                          <span className="font-semibold text-muted-foreground mr-1.5">
                            {item.month}:
                          </span>
                          <span className="font-bold text-foreground tabular-nums">
                            {formatCurrency(item.balance)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--primary)" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Monthly Cashflow Distribution */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider">
            Monthly Cashflow (Credits vs Debits)
          </CardTitle>
          <CardDescription className="text-xs">
            Inflows (deposits) vs Outflows (expenses/transfers)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="w-full h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : v)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as MonthlyStat;
                      return (
                        <div className="bg-popover border border-border p-2 rounded-lg shadow-sm text-xs flex flex-col gap-1">
                          <span className="font-semibold text-foreground">{item.month}</span>
                          <div className="flex items-center justify-between gap-3 text-income">
                            <span>Credits:</span>
                            <span className="font-bold tabular-nums">+{formatCurrency(item.credits)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-expense">
                            <span>Debits:</span>
                            <span className="font-bold tabular-nums">-{formatCurrency(item.debits)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                <Bar dataKey="credits" name="Credits" fill="var(--income)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="debits" name="Debits" fill="var(--expense)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
