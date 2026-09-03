import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../auth/authStore';
import { collections } from '@/lib/pocketbase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/financial-math';
import type { Account, Category, Transaction } from '@/types';
import {
  Wallet,
  ReceiptText,
  LogOut,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

export const TransPage: React.FC = () => {
  const { user, preferences, logout } = useAuthStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (!user) return;
      const [accList, catList, txList] = await Promise.all([
        collections.accounts().getFullList({ sort: 'order' }),
        collections.categories().getFullList({ sort: 'order' }),
        collections.transactions().getList(1, 10, {
          sort: '-date',
          expand: 'category,subcategory,from_account,to_account',
        }),
      ]);

      setAccounts(accList as Account[]);
      setCategories(catList as Category[]);
      setRecentTransactions(txList.items as Transaction[]);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleLogout = () => {
    logout();
    toast.info('Signed out of session');
  };

  const currency = preferences?.main_currency || 'INR';

  return (
    <div className="flex flex-col gap-4 p-4 pt-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground leading-tight">
              Money Manager
            </h1>
            <p className="text-[10px] text-muted-foreground">
              {user?.email || 'Authenticated User'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadData}
            className="text-muted-foreground hover:text-foreground"
            title="Refresh data"
          >
            <RefreshCw className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleLogout}
            className="text-destructive hover:bg-destructive/10"
            title="Sign Out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </div>

      {/* Welcome & Status Card */}
      <Card className="border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-xs">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="text-[9.5px] px-2 py-0.5 font-semibold gap-1">
              <Sparkles className="size-3 text-primary" />
              Phase 0 & 1 Complete
            </Badge>
            <Badge variant="outline" className="text-[9.5px] font-mono font-bold">
              {currency}
            </Badge>
          </div>
          <CardTitle className="text-base font-bold pt-1">
            Welcome back, {user?.name || 'Trader'}!
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-xs">
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            PocketBase is connected with active master data, double-entry financial math engine, and seeded account hierarchy.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2 rounded-lg bg-background border border-border/50">
              <span className="text-[9.5px] text-muted-foreground font-semibold block uppercase">
                Accounts
              </span>
              <span className="text-sm font-bold font-mono text-foreground">
                {accounts.length}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-background border border-border/50">
              <span className="text-[9.5px] text-muted-foreground font-semibold block uppercase">
                Categories
              </span>
              <span className="text-sm font-bold font-mono text-foreground">
                {categories.length}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-background border border-border/50">
              <span className="text-[9.5px] text-muted-foreground font-semibold block uppercase">
                Ledger Txs
              </span>
              <span className="text-sm font-bold font-mono text-foreground">
                {recentTransactions.length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Summary Strip */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Active Accounts ({accounts.length})
          </h2>
          <span className="text-[10px] text-primary font-semibold">
            Group Classification
          </span>
        </div>

        <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
          {accounts.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-muted text-foreground text-xs font-semibold">
                  <Layers className="size-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    {acc.name}
                  </span>
                  <span className="text-[9.5px] text-muted-foreground capitalize">
                    {acc.group.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <span className="text-xs font-bold font-mono tabular-nums text-foreground">
                {formatCurrency(acc.amount, { currency })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      {recentTransactions.length > 0 && (
        <div className="flex flex-col gap-2 pb-6">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Recent Seeded Transactions
          </h2>

          <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/50 overflow-hidden shadow-2xs">
            {recentTransactions.slice(0, 5).map((tx) => {
              const isIncome = tx.type === 'income';
              const isExpense = tx.type === 'expense';
              return (
                <div key={tx.id} className="flex items-center justify-between px-3.5 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-7 items-center justify-center rounded-md text-xs ${
                        isIncome
                          ? 'bg-income-muted text-income'
                          : isExpense
                          ? 'bg-expense-muted text-expense'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="size-3.5" />
                      ) : isExpense ? (
                        <ArrowUpRight className="size-3.5" />
                      ) : (
                        <ReceiptText className="size-3.5" />
                      )}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        {tx.note || tx.expand?.category?.name || tx.type}
                      </span>
                      <span className="text-[9.5px] text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold font-mono tabular-nums ${
                      isIncome ? 'text-income' : isExpense ? 'text-expense' : 'text-foreground'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatCurrency(tx.amount, { currency, showSymbol: true })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
