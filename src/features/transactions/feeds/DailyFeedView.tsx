import React from 'react';
import { useTransactionStore } from '../transactionStore';
import { useAuthStore } from '@/features/auth/authStore';
import type { Transaction } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tag, Layers, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';

interface DailyFeedViewProps {
  onSelectTransaction: (transaction: Transaction) => void;
}

export const DailyFeedView: React.FC<DailyFeedViewProps> = ({ onSelectTransaction }) => {
  const { preferences } = useAuthStore();
  const { getDailyGroupedTransactions, activePeriod } = useTransactionStore();

  const activeCurrency = preferences?.main_currency || 'INR';
  const groups = getDailyGroupedTransactions(activePeriod.year, activePeriod.month);

  if (groups.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-border/60 bg-card shadow-2xs">
        <Layers className="size-8 text-muted-foreground/50 mb-2" />
        <h3 className="text-xs font-bold text-foreground">No Transactions Logged</h3>
        <p className="text-[10px] text-muted-foreground mt-1 max-w-[220px]">
          Tap the "+" button below to log your first income, expense, or transfer for this period.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <div
          key={group.dateStr}
          className="flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs"
        >
          {/* Day Group Header */}
          <div className="flex items-center justify-between px-3.5 py-2 bg-muted/20 border-b border-border/40 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold font-mono text-sm text-foreground">
                {group.dayNum}
              </span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-semibold">
                {group.dayName}
              </Badge>
              <span className="text-[10px] text-muted-foreground font-mono">
                {group.monthYear}
              </span>
            </div>

            {/* Daily Total Summaries */}
            <div className="flex items-center gap-2 font-mono text-[11px]">
              {group.dayIncome > 0 && (
                <span className="text-income font-semibold tabular-nums">
                  +{formatCurrency(group.dayIncome, { currency: activeCurrency })}
                </span>
              )}
              {group.dayExpense > 0 && (
                <span className="text-expense font-semibold tabular-nums">
                  -{formatCurrency(group.dayExpense, { currency: activeCurrency })}
                </span>
              )}
            </div>
          </div>

          {/* Day Transaction Items */}
          <div className="divide-y divide-border/40">
            {group.items.map((t) => {
              const isIncome = t.type === 'income';
              const isExpense = t.type === 'expense';
              const isTransfer = t.type === 'transfer';

              return (
                <div
                  key={t.id}
                  onClick={() => onSelectTransaction(t)}
                  className="flex items-center justify-between px-3.5 py-2.5 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  {/* Category Icon & Titles */}
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-sm shadow-2xs">
                      {isTransfer ? (
                        <ArrowRightLeft className="size-4 text-foreground" />
                      ) : t.expand?.category?.icon ? (
                        <span>{t.expand.category.icon}</span>
                      ) : (
                        <Tag className="size-3.5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {isTransfer
                            ? `Transfer: ${t.expand?.from_account?.name || 'Account'} → ${t.expand?.to_account?.name || 'Account'}`
                            : t.expand?.category?.name || 'Transaction'}
                        </span>
                        {t.expand?.subcategory && (
                          <span className="text-xs text-muted-foreground truncate">
                            / {t.expand.subcategory.name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                        {t.note ? (
                          <span className="truncate text-foreground/80 font-medium">
                            {t.note}
                          </span>
                        ) : null}
                        {!isTransfer && t.expand?.from_account && (
                          <span className="truncate">[{t.expand.from_account.name}]</span>
                        )}
                        {!isTransfer && t.expand?.to_account && (
                          <span className="truncate">[{t.expand.to_account.name}]</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount & Running Tag */}
                  <div className="flex flex-col items-end shrink-0">
                    <span
                      className={`text-xs font-bold font-mono tabular-nums ${
                        isIncome
                          ? 'text-income'
                          : isExpense
                          ? 'text-expense'
                          : 'text-foreground'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatCurrency(t.amount, { currency: activeCurrency })}
                    </span>
                    {isTransfer && t.fee && t.fee > 0 ? (
                      <span className="text-[9px] font-mono text-expense">
                        Fee: {formatCurrency(t.fee, { currency: activeCurrency })}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
