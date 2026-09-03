import React from 'react';
import { useTransactionStore } from '../transactionStore';
import { useAuthStore } from '@/features/auth/authStore';
import type { Transaction } from '@/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StickyNote, Tag, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';

interface NoteJournalViewProps {
  onSelectTransaction: (transaction: Transaction) => void;
}

export const NoteJournalView: React.FC<NoteJournalViewProps> = ({ onSelectTransaction }) => {
  const { preferences } = useAuthStore();
  const { transactions } = useTransactionStore();

  const activeCurrency = preferences?.main_currency || 'INR';
  const noteTransactions = transactions.filter((t) => t.note && t.note.trim().length > 0);

  if (noteTransactions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center border-border/60 bg-card shadow-2xs">
        <StickyNote className="size-8 text-muted-foreground/50 mb-2" />
        <h3 className="text-xs font-bold text-foreground">No Notes Recorded</h3>
        <p className="text-[10px] text-muted-foreground mt-1 max-w-[220px]">
          Add notes and memos to your transactions to see them organized in this journal view.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 pb-8">
      {noteTransactions.map((t) => {
        const isIncome = t.type === 'income';
        const isExpense = t.type === 'expense';
        const isTransfer = t.type === 'transfer';

        return (
          <Card
            key={t.id}
            onClick={() => onSelectTransaction(t)}
            className="border-border/60 bg-card hover:bg-muted/30 cursor-pointer transition-all shadow-2xs"
          >
            <div className="p-3 flex flex-col gap-1.5">
              {/* Header: Date & Amount */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-mono text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                    {t.expand?.category?.name || (isTransfer ? 'Transfer' : 'Uncategorized')}
                  </Badge>
                </div>

                <span
                  className={`text-xs font-bold font-mono tabular-nums ${
                    isIncome ? 'text-income' : isExpense ? 'text-expense' : 'text-foreground'
                  }`}
                >
                  {isIncome ? '+' : isExpense ? '-' : ''}
                  {formatCurrency(t.amount, { currency: activeCurrency })}
                </span>
              </div>

              {/* Note Content */}
              <div className="flex items-start gap-2 pt-0.5">
                <StickyNote className="size-3.5 text-primary shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-foreground leading-snug">
                  {t.note}
                </p>
              </div>

              {/* Description if present */}
              {t.description && (
                <p className="text-[10.5px] text-muted-foreground pl-5.5 italic">
                  "{t.description}"
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
