import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCategoryStore } from '../categories/categoryStore';
import { useTransactionStore } from '../transactions/transactionStore';
import { useAuthStore } from '../auth/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, TrendingUp, Tag, Calendar, Layers } from 'lucide-react';
import { formatCurrency, toDecimal, Decimal } from '@/lib/financial-math';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const CategoryDeepDivePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const { categories, subcategories } = useCategoryStore();
  const { transactions, activePeriod } = useTransactionStore();

  const category = categories.find((c) => c.id === id);
  const activeCurrency = preferences?.main_currency || 'INR';

  // Active Month Transactions in this category
  const activeMonthTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.category !== id) return false;
      const d = new Date(t.date);
      return (
        d.getFullYear() === activePeriod.year &&
        d.getMonth() === activePeriod.month
      );
    });
  }, [transactions, id, activePeriod]);

  // Total spend in active month
  let activeMonthTotal = new Decimal(0);
  for (const t of activeMonthTransactions) {
    activeMonthTotal = activeMonthTotal.plus(toDecimal(t.amount));
  }
  const totalSpendNum = activeMonthTotal.toNumber();

  // Subcategory breakdown with % shares
  const subcategoryStats = useMemo(() => {
    const subMap = new Map<string, { id: string; name: string; icon?: string; amount: Decimal }>();

    for (const t of activeMonthTransactions) {
      const amt = toDecimal(t.amount);
      const subId = t.subcategory || 'main';
      const subObj = subcategories.find((s) => s.id === subId);
      const subName = subObj?.name || 'General / Main';
      const subIcon = subObj?.icon;

      const existing = subMap.get(subId) || {
        id: subId,
        name: subName,
        icon: subIcon,
        amount: new Decimal(0),
      };
      existing.amount = existing.amount.plus(amt);
      subMap.set(subId, existing);
    }

    return Array.from(subMap.values())
      .map((item) => {
        const itemAmt = item.amount.toNumber();
        const percentage = totalSpendNum > 0 ? Math.round((itemAmt / totalSpendNum) * 1000) / 10 : 0;
        return {
          ...item,
          amount: itemAmt,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [activeMonthTransactions, subcategories, totalSpendNum]);

  // 12-Month Continuous Historical Trend (Jan - Dec)
  const trendData = useMemo(() => {
    return Array.from({ length: 12 }, (_, mIdx) => {
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
        new Date(activePeriod.year, mIdx, 1)
      );

      let mSum = new Decimal(0);
      for (const t of transactions) {
        if (t.category === id) {
          const d = new Date(t.date);
          if (d.getFullYear() === activePeriod.year && d.getMonth() === mIdx) {
            mSum = mSum.plus(toDecimal(t.amount));
          }
        }
      }

      return {
        month: monthName,
        amount: mSum.toNumber(),
      };
    });
  }, [transactions, id, activePeriod.year]);

  if (!category) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <span className="text-xs text-muted-foreground">Category not found</span>
        <Button size="sm" variant="outline" onClick={() => navigate('/stats')}>
          Back to Stats
        </Button>
      </div>
    );
  }

  const isIncome = category.type === 'income';

  return (
    <div className="flex flex-col gap-4 p-4 pt-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/stats')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{category.icon || '🏷️'}</span>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                {category.name} Analytics
              </h1>
              <p className="text-[10px] text-muted-foreground">
                12-Month Trends & Subcategory Distribution
              </p>
            </div>
          </div>
        </div>

        <Badge variant={isIncome ? 'default' : 'secondary'} className="text-xs font-semibold capitalize">
          {category.type}
        </Badge>
      </div>

      {/* Category Spend Total Card */}
      <Card className="border-border/60 bg-card shadow-2xs">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Current Month Total
            </span>
            <span
              className={`text-xl font-extrabold font-mono tabular-nums ${
                isIncome ? 'text-income' : 'text-expense'
              }`}
            >
              {isIncome ? '+' : '-'}{formatCurrency(totalSpendNum, { currency: activeCurrency })}
            </span>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {activeMonthTransactions.length} Transactions
          </span>
        </CardContent>
      </Card>

      {/* 12-Month Continuous Trend Curve */}
      <Card className="border-border/60 bg-card shadow-2xs">
        <CardHeader className="p-3.5 pb-1">
          <CardTitle className="text-xs font-bold flex items-center gap-1.5">
            <TrendingUp className="size-3.5 text-primary" />
            12-Month Historical Trend ({activePeriod.year})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3.5 pt-2">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.6} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val, { currency: activeCurrency }), 'Spend']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    color: 'hsl(var(--card-foreground))',
                    borderRadius: 'var(--radius)',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '11px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={isIncome ? 'hsl(var(--income))' : 'hsl(var(--expense))'}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: isIncome ? 'hsl(var(--income))' : 'hsl(var(--expense))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subcategory Distribution Breakdown */}
      {subcategoryStats.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
            Subcategory Breakdown
          </span>

          <div className="flex flex-col rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
            {subcategoryStats.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-xs">
                    {sub.icon ? <span>{sub.icon}</span> : <Tag className="size-3" />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {sub.name}
                    </span>
                    <span className="text-[9.5px] font-mono text-muted-foreground">
                      {sub.percentage}% of total
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold font-mono text-foreground tabular-nums">
                  {formatCurrency(sub.amount, { currency: activeCurrency })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtered Itemized Transactions */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
          Transactions This Month ({activeMonthTransactions.length})
        </span>

        <div className="flex flex-col rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
          {activeMonthTransactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-3">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-semibold text-foreground truncate">
                  {t.note || t.expand?.subcategory?.name || category.name}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </span>
              </div>

              <span
                className={`text-xs font-bold font-mono tabular-nums ${
                  isIncome ? 'text-income' : 'text-expense'
                }`}
              >
                {isIncome ? '+' : '-'}{formatCurrency(t.amount, { currency: activeCurrency })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
