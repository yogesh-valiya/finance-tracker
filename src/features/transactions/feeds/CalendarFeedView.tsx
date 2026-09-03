import React, { useState } from 'react';
import { useTransactionStore } from '../transactionStore';
import { useAuthStore } from '@/features/auth/authStore';
import { DayDetailsSheet } from './DayDetailsSheet';
import type { Transaction } from '@/types';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/financial-math';

interface CalendarFeedViewProps {
  onSelectTransaction: (transaction: Transaction) => void;
  onQuickAddDate: (date: Date) => void;
}

export const CalendarFeedView: React.FC<CalendarFeedViewProps> = ({
  onSelectTransaction,
  onQuickAddDate,
}) => {
  const { preferences } = useAuthStore();
  const { getCalendarMatrix, activePeriod } = useTransactionStore();

  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<Transaction[]>([]);
  const [isDaySheetOpen, setIsDaySheetOpen] = useState(false);

  const activeCurrency = preferences?.main_currency || 'INR';
  const cells = getCalendarMatrix(activePeriod.year, activePeriod.month);

  const weekDayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleCellClick = (cell: (typeof cells)[0]) => {
    setSelectedDayDate(cell.date);
    setSelectedDayTransactions(cell.items);
    setIsDaySheetOpen(true);
  };

  return (
    <>
      <Card className="flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden shadow-2xs">
        {/* Week Day Header */}
        <div className="grid grid-cols-7 border-b border-border/40 bg-muted/30 text-center py-2">
          {weekDayLabels.map((d, idx) => (
            <span
              key={d}
              className={`text-[10px] font-bold uppercase tracking-wider ${
                idx === 0 ? 'text-expense' : idx === 6 ? 'text-income' : 'text-muted-foreground'
              }`}
            >
              {d}
            </span>
          ))}
        </div>

        {/* 7-Column Calendar Grid Matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-border/40">
          {cells.map((cell, idx) => {
            const hasActivity = cell.income > 0 || cell.expense > 0;

            return (
              <div
                key={idx}
                onClick={() => handleCellClick(cell)}
                className={`flex flex-col justify-between p-1 min-h-[58px] cursor-pointer transition-colors active:scale-[0.98] ${
                  !cell.isCurrentMonth
                    ? 'opacity-30 bg-muted/10'
                    : cell.isToday
                    ? 'bg-primary/5 ring-1 ring-inset ring-primary/40'
                    : 'hover:bg-accent/40'
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-bold font-mono ${
                      cell.isToday
                        ? 'flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9.5px]'
                        : 'text-foreground'
                    }`}
                  >
                    {cell.dayNum}
                  </span>
                </div>

                {/* Multi-Line Income & Expense Aggregates */}
                <div className="flex flex-col items-end gap-0.5 text-[8px] font-mono leading-none">
                  {cell.income > 0 && (
                    <span className="text-income font-bold truncate max-w-full">
                      +{Math.round(cell.income)}
                    </span>
                  )}
                  {cell.expense > 0 && (
                    <span className="text-expense font-bold truncate max-w-full">
                      -{Math.round(cell.expense)}
                    </span>
                  )}
                  {hasActivity && (
                    <span className="text-muted-foreground font-semibold border-t border-border/40 pt-0.5 mt-0.5">
                      {Math.round(cell.net)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Day Inspection Drawer */}
      <DayDetailsSheet
        open={isDaySheetOpen}
        onOpenChange={setIsDaySheetOpen}
        date={selectedDayDate}
        transactions={selectedDayTransactions}
        onSelectTransaction={onSelectTransaction}
        onQuickAdd={onQuickAddDate}
      />
    </>
  );
};
