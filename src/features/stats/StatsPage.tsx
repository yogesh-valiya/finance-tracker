import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '../transactions/transactionStore';
import { useCategoryStore } from '../categories/categoryStore';
import { useAuthStore } from '../auth/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  PieChart as PieChartIcon,
  Tag,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { formatCurrency, toDecimal, Decimal } from '@/lib/financial-math';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from 'recharts';

// Theme-tailored chart color palette using HSL CSS variables
const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--income))',
  'hsl(var(--expense))',
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#6366f1', // indigo
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // violet
];

export const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [dimension, setDimension] = useState<'expense' | 'income'>('expense');
  const [periodType, setPeriodType] = useState<'monthly' | 'weekly' | 'annually'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, [fetchTransactions, fetchCategories]);

  const activeCurrency = preferences?.main_currency || 'INR';

  // Filter transactions for active period
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== dimension) return false;
      const d = new Date(t.date);

      if (periodType === 'monthly') {
        return (
          d.getFullYear() === currentDate.getFullYear() &&
          d.getMonth() === currentDate.getMonth()
        );
      } else if (periodType === 'annually') {
        return d.getFullYear() === currentDate.getFullYear();
      } else {
        // weekly (current 7 days)
        const diffDays = Math.abs((currentDate.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }
    });
  }, [transactions, dimension, periodType, currentDate]);

  // Compute Ranked Category Breakdown & Total
  const { categoryStats, totalAmount } = useMemo(() => {
    let total = new Decimal(0);
    const catMap = new Map<string, { categoryId: string; name: string; icon?: string; amount: Decimal }>();

    for (const t of filteredTransactions) {
      const amt = toDecimal(t.amount);
      total = total.plus(amt);

      const catId = t.category || 'other';
      const catObj = categories.find((c) => c.id === catId);
      const catName = catObj?.name || 'Uncategorized';
      const catIcon = catObj?.icon;

      const existing = catMap.get(catId) || {
        categoryId: catId,
        name: catName,
        icon: catIcon,
        amount: new Decimal(0),
      };
      existing.amount = existing.amount.plus(amt);
      catMap.set(catId, existing);
    }

    const totalNum = total.toNumber();
    const statsList = Array.from(catMap.values())
      .map((item, idx) => {
        const itemAmount = item.amount.toNumber();
        const percentage = totalNum > 0 ? Math.round((itemAmount / totalNum) * 1000) / 10 : 0;
        return {
          id: item.categoryId,
          name: item.name,
          icon: item.icon,
          amount: itemAmount,
          percentage,
          color: CHART_COLORS[idx % CHART_COLORS.length],
        };
      })
      .sort((a, b) => b.amount - a.amount);

    return { categoryStats: statsList, totalAmount: totalNum };
  }, [filteredTransactions, categories]);

  // Date Navigation
  const handlePrev = () => {
    if (periodType === 'monthly') {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (periodType === 'annually') {
      setCurrentDate((d) => new Date(d.getFullYear() - 1, 0, 1));
    } else {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
    }
  };

  const handleNext = () => {
    if (periodType === 'monthly') {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else if (periodType === 'annually') {
      setCurrentDate((d) => new Date(d.getFullYear() + 1, 0, 1));
    } else {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
    }
  };

  const periodLabel = useMemo(() => {
    if (periodType === 'annually') return currentDate.getFullYear().toString();
    if (periodType === 'monthly') {
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(currentDate);
    }
    return `Week of ${currentDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`;
  }, [periodType, currentDate]);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 pt-4 pb-24">
      {/* Header Bar: Period Type Selector + Date Navigator */}
      <div className="flex items-center justify-between">
        {/* Period Selector */}
        <Select value={periodType} onValueChange={(v) => setPeriodType(v as any)}>
          <SelectTrigger className="h-8 text-xs font-semibold w-28">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly" className="text-xs">Weekly</SelectItem>
            <SelectItem value="monthly" className="text-xs">Monthly</SelectItem>
            <SelectItem value="annually" className="text-xs">Annually</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Navigator */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5 border border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handlePrev}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="text-xs font-bold font-mono px-2">
            {periodLabel}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleNext}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Dimension Switcher: Expenses vs Income */}
      <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-muted/60 border border-border/40">
        <Button
          type="button"
          variant={dimension === 'expense' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setDimension('expense')}
          className={`h-8 text-xs font-bold rounded-lg transition-all ${
            dimension === 'expense' ? 'bg-expense text-expense-foreground shadow-xs' : 'text-muted-foreground'
          }`}
        >
          Expenses
        </Button>
        <Button
          type="button"
          variant={dimension === 'income' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setDimension('income')}
          className={`h-8 text-xs font-bold rounded-lg transition-all ${
            dimension === 'income' ? 'bg-income text-income-foreground shadow-xs' : 'text-muted-foreground'
          }`}
        >
          Income
        </Button>
      </div>

      {/* Total Amount & Interactive Donut Chart */}
      <Card className="border-border/60 bg-card shadow-2xs">
        <CardContent className="flex flex-col items-center justify-center p-4">
          <div className="text-center mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Total {dimension === 'expense' ? 'Expenses' : 'Income'}
            </span>
            <div className={`text-xl font-extrabold font-mono tabular-nums ${
              dimension === 'expense' ? 'text-expense' : 'text-income'
            }`}>
              {formatCurrency(totalAmount, { currency: activeCurrency })}
            </div>
          </div>

          {/* Interactive Recharts Donut */}
          {categoryStats.length > 0 ? (
            <div className="h-48 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(val, { currency: activeCurrency }), 'Amount']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--card-foreground))',
                      borderRadius: 'var(--radius)',
                      border: '1px solid hsl(var(--border))',
                      fontSize: '11px',
                    }}
                  />
                  <Pie
                    activeIndex={activeIndex !== null ? activeIndex : undefined}
                    activeShape={renderActiveShape}
                    data={categoryStats}
                    dataKey="amount"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    onMouseEnter={onPieEnter}
                    onClick={(_, idx) => setActiveIndex(idx)}
                  >
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No {dimension} records for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranked Category Breakdown List */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
          Ranked Category Distribution ({categoryStats.length})
        </span>

        <div className="flex flex-col rounded-2xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
          {categoryStats.map((stat, idx) => {
            const isHighlighted = activeIndex === idx;

            return (
              <div
                key={stat.id}
                onClick={() => navigate(`/stats/category/${stat.id}`)}
                className={`flex items-center justify-between p-3 cursor-pointer transition-all ${
                  isHighlighted ? 'bg-primary/10' : 'hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <div
                    className="flex size-8 shrink-0 items-center justify-center rounded-xl text-sm shadow-2xs"
                    style={{ backgroundColor: `${stat.color}25`, color: stat.color }}
                  >
                    {stat.icon ? <span>{stat.icon}</span> : <Tag className="size-3.5" />}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-foreground truncate">
                      {stat.name}
                    </span>
                    {/* Micro-Progress Bar */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${stat.percentage}%`, backgroundColor: stat.color }}
                        />
                      </div>
                      <span className="text-[9.5px] font-mono font-semibold text-muted-foreground">
                        {stat.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold font-mono text-foreground tabular-nums">
                    {formatCurrency(stat.amount, { currency: activeCurrency })}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
