import React from 'react';
import { useAuthStore } from '@/features/auth/authStore';
import type { Transaction } from '@/types';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, ArrowRightLeft } from 'lucide-react';
import { formatCurrency, toDecimal } from '@/lib/financial-math';

interface DayDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  transactions: Transaction[];
  onSelectTransaction: (transaction: Transaction) => void;
  onQuickAdd: (date: Date) => void;
}

export const DayDetailsSheet: React.FC<DayDetailsSheetProps> = ({
  open,
  onOpenChange,
  date,
  transactions,
  onSelectTransaction,
  onQuickAdd,
}) => {
  const { preferences } = useAuthStore();
  const activeCurrency = preferences?.main_currency || 'INR';

  if (!date) return null;

  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of transactions) {
    if (t.type === 'income') totalIncome = toDecimal(totalIncome).plus(toDecimal(t.amount)).toNumber();
    if (t.type === 'expense') totalExpense = toDecimal(totalExpense).plus(toDecimal(t.amount)).toNumber();
  }

  const dateLabel = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl p-4 gap-3">
        <SheetHeader className="pb-2 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-sm font-bold flex items-center gap-2">
                <span>{dateLabel}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {dayName}
                </Badge>
              </SheetTitle>
              <div className="flex items-center gap-3 text-[11px] font-mono pt-1">
                <span className="text-income font-semibold">
                  +{formatCurrency(totalIncome, { currency: activeCurrency })}
                </span>
                <span className="text-expense font-semibold">
                  -{formatCurrency(totalExpense, { currency: activeCurrency })}
                </span>
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onQuickAdd(date);
              }}
              className="h-8 px-2.5 text-xs font-semibold gap-1"
            >
              <Plus className="size-3.5" />
              Add
            </Button>
          </div>
        </SheetHeader>

        {/* Itemized Transactions on this Day */}
        <div className="flex flex-col divide-y divide-border/40 max-h-[55vh] overflow-y-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No transactions recorded for this day.
            </div>
          ) : (
            transactions.map((t) => {
              const isIncome = t.type === 'income';
              const isExpense = t.type === 'expense';
              const isTransfer = t.type === 'transfer';

              return (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTransaction(t);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between py-2.5 px-1 hover:bg-accent/40 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
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
                      <span className="text-xs font-semibold text-foreground truncate">
                        {isTransfer
                          ? `Transfer: ${t.expand?.from_account?.name || 'Account'} → ${t.expand?.to_account?.name || 'Account'}`
                          : t.expand?.category?.name || 'Transaction'}
                      </span>
                      {t.note && (
                        <span className="text-[10px] text-muted-foreground truncate font-medium">
                          {t.note}
                        </span>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold font-mono tabular-nums shrink-0 ${
                      isIncome ? 'text-income' : isExpense ? 'text-expense' : 'text-foreground'
                    }`}
                  >
                    {isIncome ? '+' : isExpense ? '-' : ''}
                    {formatCurrency(t.amount, { currency: activeCurrency })}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
