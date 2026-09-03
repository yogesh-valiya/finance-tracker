import React, { useState, useMemo } from 'react';
import { useTransactionStore } from '../transactionStore';
import { useAuthStore } from '@/features/auth/authStore';
import type { Transaction } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  Tag,
  Calendar,
} from 'lucide-react';
import { formatCurrency, toDecimal } from '@/lib/financial-math';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTransaction: (transaction: Transaction) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  open,
  onOpenChange,
  onSelectTransaction,
}) => {
  const { preferences } = useAuthStore();
  const { transactions } = useTransactionStore();
  const activeCurrency = preferences?.main_currency || 'INR';

  const [query, setQuery] = useState('');

  // Suggestions extracted from historical transactions
  const suggestions = useMemo(() => {
    if (!query.trim()) {
      const topNotes = transactions
        .map((t) => t.note?.trim())
        .filter((Boolean as unknown) as (x: any) => x is string);
      return Array.from(new Set(topNotes)).slice(0, 6);
    }
    const q = query.toLowerCase().trim();
    const matches = transactions
      .map((t) => t.note?.trim())
      .filter((n): n is string => !!n && n.toLowerCase().includes(q));
    return Array.from(new Set(matches)).slice(0, 6);
  }, [transactions, query]);

  // Filtered transactions matching query
  const matchingTransactions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();

    return transactions.filter((t) => {
      const noteMatch = t.note?.toLowerCase().includes(q);
      const descMatch = t.description?.toLowerCase().includes(q);
      const catMatch = t.expand?.category?.name?.toLowerCase().includes(q);
      const subcatMatch = t.expand?.subcategory?.name?.toLowerCase().includes(q);
      const fromAcc = t.expand?.from_account?.name?.toLowerCase().includes(q);
      const toAcc = t.expand?.to_account?.name?.toLowerCase().includes(q);
      const amtMatch = t.amount.toString().includes(q);

      return noteMatch || descMatch || catMatch || subcatMatch || fromAcc || toAcc || amtMatch;
    });
  }, [transactions, query]);

  // Matching Metrics Summary
  let totalIncome = 0;
  let totalExpense = 0;
  for (const t of matchingTransactions) {
    if (t.type === 'income') totalIncome = toDecimal(totalIncome).plus(toDecimal(t.amount)).toNumber();
    if (t.type === 'expense') totalExpense = toDecimal(totalExpense).plus(toDecimal(t.amount)).toNumber();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl p-4 gap-3 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Search className="size-4 text-primary" />
            Search Transactions
          </DialogTitle>
        </DialogHeader>

        {/* Search Input Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search note, category, account, amount..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 pl-8 pr-8 text-xs rounded-xl"
            autoFocus
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setQuery('')}
              className="absolute right-2 text-muted-foreground hover:text-foreground h-6 w-6"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {/* Suggestions Chips */}
        {suggestions.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
              Suggestions
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {suggestions.map((s, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setQuery(s)}
                  className="h-6 px-2.5 text-[10.5px] rounded-full text-foreground hover:bg-muted border-border/60"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Matching Totals Metric Header */}
        {query.trim() && (
          <div className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 text-xs">
            <div className="flex flex-col">
              <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
                Matches ({matchingTransactions.length})
              </span>
              <span className="font-bold text-income tabular-nums">
                +{formatCurrency(totalIncome, { currency: activeCurrency })}
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
                Expense Total
              </span>
              <span className="font-bold text-expense tabular-nums">
                -{formatCurrency(totalExpense, { currency: activeCurrency })}
              </span>
            </div>
          </div>
        )}

        {/* Search Results List */}
        {query.trim() && (
          <div className="flex flex-col divide-y divide-border/40 rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs max-h-[45vh] overflow-y-auto">
            {matchingTransactions.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matching transactions found for "{query}"
              </div>
            ) : (
              matchingTransactions.map((t) => {
                const isIncome = t.type === 'income';
                const isExpense = t.type === 'expense';

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTransaction(t);
                      onOpenChange(false);
                    }}
                    className="flex items-center justify-between px-3 py-2.5 hover:bg-accent/40 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary/80 text-xs">
                        {t.expand?.category?.icon ? (
                          <span>{t.expand.category.icon}</span>
                        ) : (
                          <Tag className="size-3 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {t.note || t.expand?.category?.name || t.type}
                        </span>
                        <div className="flex items-center gap-1 text-[9.5px] text-muted-foreground truncate">
                          <span>
                            {new Date(t.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span>•</span>
                          <span className="truncate">{t.expand?.category?.name || 'Uncategorized'}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-xs font-bold font-mono tabular-nums shrink-0 ${
                      isIncome ? 'text-income' : isExpense ? 'text-expense' : 'text-foreground'
                    }`}>
                      {isIncome ? '+' : isExpense ? '-' : ''}{formatCurrency(t.amount, { currency: activeCurrency })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
