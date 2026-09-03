import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccountStore } from './accountStore';
import { useAuthStore } from '../auth/authStore';
import { ACCOUNT_GROUPS } from '@/types';
import type { Transaction } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Pencil,
  Plus,
  Layers,
  Tag,
} from 'lucide-react';
import { formatCurrency, toDecimal } from '@/lib/financial-math';

export const AccountLedgerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const { accounts, transactions, fetchAccounts, getAccountBalance } = useAccountStore();

  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'annually'>('daily');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const account = accounts.find((a) => a.id === id);
  const activeCurrency = preferences?.main_currency || 'INR';

  // Filter transactions for this specific account
  const accountTransactions = useMemo(() => {
    if (!id) return [];
    return transactions.filter(
      (t) => t.from_account === id || t.to_account === id
    );
  }, [transactions, id]);

  const currentMonthTransactions = useMemo(() => {
    return accountTransactions.filter((t) => {
      const tDate = new Date(t.date);
      return (
        tDate.getFullYear() === currentDate.getFullYear() &&
        tDate.getMonth() === currentDate.getMonth()
      );
    });
  }, [accountTransactions, currentDate]);

  // Group current month transactions by Date string
  const groupedByDay = useMemo(() => {
    if (!id) return [];
    const groups: { dateStr: string; date: Date; items: Transaction[]; dayDeposit: number; dayWithdrawal: number }[] = [];
    const dateMap = new Map<string, Transaction[]>();

    for (const t of currentMonthTransactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const list = dateMap.get(key) || [];
      list.push(t);
      dateMap.set(key, list);
    }

    for (const [key, items] of dateMap.entries()) {
      let dayDeposit = 0;
      let dayWithdrawal = 0;

      for (const t of items) {
        const amt = Number(t.amount) || 0;
        const fee = Number(t.fee) || 0;
        if (t.type === 'income' && t.to_account === id) dayDeposit += amt;
        if (t.type === 'expense' && t.from_account === id) dayWithdrawal += amt;
        if (t.type === 'transfer') {
          if (t.to_account === id) dayDeposit += amt;
          if (t.from_account === id) dayWithdrawal += (amt + fee);
        }
      }

      groups.push({
        dateStr: key,
        date: new Date(items[0].date),
        items: items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        dayDeposit,
        dayWithdrawal,
      });
    }

    return groups.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [currentMonthTransactions, id]);

  // Current Month String
  const monthYearLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(currentDate);

  const prevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3">
        <span className="text-xs text-muted-foreground">Account not found</span>
        <Button size="sm" variant="outline" onClick={() => navigate('/accounts')}>
          Back to Accounts
        </Button>
      </div>
    );
  }

  const groupMeta = ACCOUNT_GROUPS.find((g) => g.id === account.group);

  let totalDeposit = 0;
  let totalWithdrawal = 0;

  for (const t of currentMonthTransactions) {
    const amt = Number(t.amount) || 0;
    const fee = Number(t.fee) || 0;

    if (t.type === 'income' && t.to_account === id) {
      totalDeposit = toDecimal(totalDeposit).plus(toDecimal(amt)).toNumber();
    } else if (t.type === 'expense' && t.from_account === id) {
      totalWithdrawal = toDecimal(totalWithdrawal).plus(toDecimal(amt)).toNumber();
    } else if (t.type === 'transfer') {
      if (t.to_account === id) {
        totalDeposit = toDecimal(totalDeposit).plus(toDecimal(amt)).toNumber();
      }
      if (t.from_account === id) {
        totalWithdrawal = toDecimal(totalWithdrawal).plus(toDecimal(amt).plus(toDecimal(fee))).toNumber();
      }
    }
  }

  const netPeriodChange = toDecimal(totalDeposit).minus(toDecimal(totalWithdrawal)).toNumber();
  const currentLiveBalance = getAccountBalance(account);

  return (
    <div className="flex flex-col gap-3.5 p-4 pt-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/accounts')}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{groupMeta?.icon || '🏦'}</span>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                {account.name}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                {groupMeta?.name} Statement
              </p>
            </div>
          </div>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-0.5 border border-border/40">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={prevMonth}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3" />
          </Button>
          <span className="text-[11px] font-bold font-mono px-1">
            {monthYearLabel}
          </span>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={nextMonth}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>

      {/* Sub-Tabs: Daily | Monthly | Annually */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as any)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-3 w-full h-8 bg-muted/60 p-0.5 border border-border/40">
          <TabsTrigger value="daily" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Daily
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="annually" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Annually
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 4-Metric Statement Header Strip */}
      <Card className="border-border/60 bg-card shadow-2xs overflow-hidden">
        <CardContent className="flex flex-col p-3 gap-2.5">
          {/* Statement Range & Shortcuts */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <span className="text-[10px] text-muted-foreground font-mono">
              Statement {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1))} ~ {new Intl.DateTimeFormat('en-US', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0))}
            </span>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => navigate(`/accounts/${account.id}/stats`)}
                className="text-muted-foreground hover:text-foreground h-6 w-6"
                title="Account Stats"
              >
                <BarChart2 className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => navigate(`/accounts/${account.id}/info`)}
                className="text-muted-foreground hover:text-foreground h-6 w-6"
                title="Edit Account"
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          </div>

          {/* 4 Metrics Grid */}
          <div className="grid grid-cols-4 gap-1 text-center">
            {/* Deposit */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-semibold text-muted-foreground">
                Deposit
              </span>
              <span className="text-[11px] font-bold font-mono text-income tabular-nums">
                {formatCurrency(totalDeposit, { currency: activeCurrency })}
              </span>
            </div>

            {/* Withdrawal */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-semibold text-muted-foreground">
                Withdrawal
              </span>
              <span className="text-[11px] font-bold font-mono text-expense tabular-nums">
                {formatCurrency(totalWithdrawal, { currency: activeCurrency })}
              </span>
            </div>

            {/* Total */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-semibold text-muted-foreground">
                Total
              </span>
              <span className={`text-[11px] font-bold font-mono tabular-nums ${
                netPeriodChange >= 0 ? 'text-foreground' : 'text-expense'
              }`}>
                {formatCurrency(netPeriodChange, { currency: activeCurrency })}
              </span>
            </div>

            {/* Balance */}
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-semibold text-muted-foreground">
                Balance
              </span>
              <span className="text-[11px] font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(currentLiveBalance, { currency: activeCurrency })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Daily Grouped Ledger Feed */}
      {groupedByDay.length === 0 ? (
        <Card className="border-border/60 p-8 text-center shadow-2xs">
          <Layers className="size-8 mx-auto text-muted-foreground/60 mb-2" />
          <h3 className="text-xs font-bold text-foreground">No Transactions in {monthYearLabel}</h3>
          <p className="text-[11px] text-muted-foreground mt-1">
            Tap the "+ Add" button below to log your first transaction for this account.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {groupedByDay.map((group) => {
            const dayNum = group.date.getDate();
            const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(group.date);
            const monthYear = new Intl.DateTimeFormat('en-US', { month: '2-digit', year: 'numeric' }).format(group.date);

            return (
              <div
                key={group.dateStr}
                className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between px-3.5 py-2 bg-muted/20 border-b border-border/40 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold font-mono text-sm text-foreground">
                      {dayNum}
                    </span>
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-semibold">
                      {dayName}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {monthYear}
                    </span>
                  </div>

                  {/* Daily Total Summaries */}
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    {group.dayDeposit > 0 && (
                      <span className="text-income font-semibold">
                        +{formatCurrency(group.dayDeposit, { currency: activeCurrency })}
                      </span>
                    )}
                    {group.dayWithdrawal > 0 && (
                      <span className="text-expense font-semibold">
                        -{formatCurrency(group.dayWithdrawal, { currency: activeCurrency })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Transaction Items */}
                <div className="divide-y divide-border/40">
                  {group.items.map((t) => {
                    const isIncome = t.type === 'income' || (t.type === 'transfer' && t.to_account === id);

                    return (
                      <div
                        key={t.id}
                        className="flex items-center justify-between px-3.5 py-2.5 hover:bg-accent/40 transition-colors"
                      >
                        {/* Category Icon & Titles */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary/80 text-sm shadow-2xs">
                            {t.expand?.category?.icon ? (
                              <span>{t.expand.category.icon}</span>
                            ) : (
                              <Tag className="size-3 text-muted-foreground" />
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {t.expand?.category?.name || (t.type === 'transfer' ? 'Transfer' : 'Transaction')}
                              {t.expand?.subcategory ? ` / ${t.expand.subcategory.name}` : ''}
                            </span>
                            {t.note && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                {t.note}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount & Running Tag */}
                        <div className="flex flex-col items-end shrink-0">
                          <span className={`text-xs font-bold font-mono tabular-nums ${
                            isIncome ? 'text-income' : 'text-expense'
                          }`}>
                            {isIncome ? '+' : '-'}{formatCurrency(t.amount, { currency: activeCurrency })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
