import React, { useState } from 'react';
import { useTransactionStore } from '../transactionStore';
import { useAuthStore } from '@/features/auth/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';

export const MonthlySummaryView: React.FC = () => {
  const { preferences } = useAuthStore();
  const { getAnnualMonthlySummary, activePeriod, setActivePeriod } = useTransactionStore();

  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({});

  const activeCurrency = preferences?.main_currency || 'INR';
  const annualSummary = getAnnualMonthlySummary(activePeriod.year);

  const toggleMonthExpand = (mNum: number) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [mNum]: !prev[mNum],
    }));
  };

  const prevYear = () => {
    setActivePeriod({ ...activePeriod, year: activePeriod.year - 1 });
  };

  const nextYear = () => {
    setActivePeriod({ ...activePeriod, year: activePeriod.year + 1 });
  };

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* Year Navigator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1 border border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={prevYear}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="text-xs font-bold font-mono px-2">
            {annualSummary.year}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={nextYear}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        <Badge variant="outline" className="text-xs font-mono font-bold">
          Net: {formatCurrency(annualSummary.netSavings, { currency: activeCurrency })}
        </Badge>
      </div>

      {/* Full-Year Summary Totals Card */}
      <Card className="border-border/60 bg-card shadow-2xs">
        <CardContent className="grid grid-cols-3 gap-2 p-3 text-center">
          <div className="flex flex-col">
            <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
              Total Income
            </span>
            <span className="text-xs font-bold font-mono text-income tabular-nums">
              +{formatCurrency(annualSummary.totalIncome, { currency: activeCurrency })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
              Total Expense
            </span>
            <span className="text-xs font-bold font-mono text-expense tabular-nums">
              -{formatCurrency(annualSummary.totalExpense, { currency: activeCurrency })}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
              Net Savings
            </span>
            <span
              className={`text-xs font-bold font-mono tabular-nums ${
                annualSummary.netSavings >= 0 ? 'text-foreground' : 'text-expense'
              }`}
            >
              {formatCurrency(annualSummary.netSavings, { currency: activeCurrency })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 12-Month Table with Expandable Weekly Drilldown */}
      <div className="flex flex-col rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
        {annualSummary.months.map((m) => {
          const isExpanded = expandedMonths[m.monthNum] || false;
          const hasData = m.income > 0 || m.expense > 0;

          return (
            <div key={m.monthNum} className="flex flex-col">
              {/* Month Header Row */}
              <div
                onClick={() => hasData && toggleMonthExpand(m.monthNum)}
                className={`flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                  hasData ? 'cursor-pointer hover:bg-muted/40' : 'opacity-60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono w-7 text-foreground">
                    {m.monthName}
                  </span>
                  {hasData && (
                    <ChevronDown
                      className={`size-3 text-muted-foreground transition-transform ${
                        isExpanded ? '-rotate-180' : ''
                      }`}
                    />
                  )}
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <span className="text-income font-semibold tabular-nums w-16 text-right">
                    {m.income > 0 ? `+${Math.round(m.income)}` : '0'}
                  </span>
                  <span className="text-expense font-semibold tabular-nums w-16 text-right">
                    {m.expense > 0 ? `-${Math.round(m.expense)}` : '0'}
                  </span>
                  <span
                    className={`font-bold tabular-nums w-16 text-right ${
                      m.net >= 0 ? 'text-foreground' : 'text-expense'
                    }`}
                  >
                    {Math.round(m.net)}
                  </span>
                </div>
              </div>

              {/* Weekly Accordion Breakdown */}
              {isExpanded && (
                <div className="bg-muted/20 divide-y divide-border/30 border-t border-border/40 px-3 py-1">
                  {m.weeks.map((w, wIdx) => (
                    <div
                      key={wIdx}
                      className="flex items-center justify-between py-1.5 text-[11px]"
                    >
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {w.weekLabel}
                      </span>
                      <div className="flex items-center gap-3 font-mono text-[10.5px]">
                        <span className="text-income tabular-nums w-14 text-right">
                          {w.income > 0 ? `+${Math.round(w.income)}` : '0'}
                        </span>
                        <span className="text-expense tabular-nums w-14 text-right">
                          {w.expense > 0 ? `-${Math.round(w.expense)}` : '0'}
                        </span>
                        <span
                          className={`font-semibold tabular-nums w-14 text-right ${
                            w.net >= 0 ? 'text-foreground' : 'text-expense'
                          }`}
                        >
                          {Math.round(w.net)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
