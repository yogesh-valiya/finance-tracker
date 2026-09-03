import React from 'react';
import { useTransactionStore } from '../transactionStore';
import { useAuthStore } from '@/features/auth/authStore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileSpreadsheet, Download, TrendingUp, TrendingDown, CreditCard, Wallet, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';
import { toast } from 'sonner';

export const TotalAccountOverviewView: React.FC = () => {
  const { preferences } = useAuthStore();
  const { getPaymentBreakdown, activePeriod, transactions } = useTransactionStore();

  const activeCurrency = preferences?.main_currency || 'INR';
  const breakdown = getPaymentBreakdown(activePeriod.year, activePeriod.month);

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error('No transactions available to export');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Subcategory', 'Amount', 'Fee', 'From Account', 'To Account', 'Note', 'Description'];
    const rows = transactions.map((t) => [
      new Date(t.date).toISOString().split('T')[0],
      t.type,
      t.expand?.category?.name || '',
      t.expand?.subcategory?.name || '',
      t.amount,
      t.fee || 0,
      t.expand?.from_account?.name || '',
      t.expand?.to_account?.name || '',
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `money_manager_export_${activePeriod.year}_${activePeriod.month + 1}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transaction data exported to CSV');
  };

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* Top Monthly Spend Comparison Banner */}
      <Card className="border-border/60 bg-card shadow-2xs">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              Compared to Last Month
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              {breakdown.comparedPercentage >= 0 ? (
                <TrendingUp className="size-4 text-expense" />
              ) : (
                <TrendingDown className="size-4 text-income" />
              )}
              <span
                className={`text-base font-extrabold font-mono tabular-nums ${
                  breakdown.comparedPercentage >= 0 ? 'text-expense' : 'text-income'
                }`}
              >
                {breakdown.comparedPercentage >= 0 ? '+' : ''}
                {breakdown.comparedPercentage}%
              </span>
            </div>
          </div>

          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground">
              Last Month Spend
            </span>
            <span className="text-xs font-bold font-mono text-muted-foreground tabular-nums">
              {formatCurrency(breakdown.lastMonthExpense, { currency: activeCurrency })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method Distribution Breakdown */}
      <div className="flex flex-col gap-2.5">
        <span className="text-[10px] uppercase font-bold text-muted-foreground px-1">
          Payment Method Spend Distribution
        </span>

        {/* Cash & Bank Accounts */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-secondary/80 text-foreground">
                <Wallet className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  Cash & Bank Accounts
                </span>
                <span className="text-[9.5px] text-muted-foreground">
                  Direct debit & liquid cash expenses
                </span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-foreground tabular-nums">
              {formatCurrency(breakdown.cashAccountsExpense, { currency: activeCurrency })}
            </span>
          </CardContent>
        </Card>

        {/* Credit Cards & Prepaid */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-secondary/80 text-foreground">
                <CreditCard className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  Credit Cards & Pay
                </span>
                <span className="text-[9.5px] text-muted-foreground">
                  Billed statement & card debt
                </span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-expense tabular-nums">
              {formatCurrency(breakdown.cardsPayExpense, { currency: activeCurrency })}
            </span>
          </CardContent>
        </Card>

        {/* Transfer Volume */}
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-xl bg-secondary/80 text-foreground">
                <ArrowRightLeft className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-foreground">
                  Internal Transfers
                </span>
                <span className="text-[9.5px] text-muted-foreground">
                  Inter-account movements & reallocation
                </span>
              </div>
            </div>
            <span className="text-xs font-bold font-mono text-foreground tabular-nums">
              {formatCurrency(breakdown.transferVolume, { currency: activeCurrency })}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Export to Excel / CSV Action */}
      <Button
        type="button"
        variant="outline"
        onClick={handleExportCSV}
        className="h-10 text-xs font-bold gap-2 rounded-2xl border-border/80 bg-card hover:bg-muted/40 text-foreground shadow-2xs mt-2"
      >
        <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
        Export Data to Excel / CSV
      </Button>
    </div>
  );
};
