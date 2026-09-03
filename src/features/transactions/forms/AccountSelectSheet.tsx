import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountStore } from '@/features/accounts/accountStore';
import { ACCOUNT_GROUPS } from '@/types';
import type { Account } from '@/types';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/financial-math';
import { Pencil, X, Check } from 'lucide-react';

interface AccountSelectSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  selectedAccountId?: string;
  onSelect: (account: Account) => void;
  currency?: string;
}

export const AccountSelectSheet: React.FC<AccountSelectSheetProps> = ({
  open,
  onOpenChange,
  title = 'Accounts',
  selectedAccountId,
  onSelect,
  currency = 'INR',
}) => {
  const navigate = useNavigate();
  const { accounts, getAccountBalance } = useAccountStore();
  const visibleAccounts = accounts.filter((a) => !a.is_hidden);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[75vh] max-h-[75vh] rounded-t-3xl p-0 flex flex-col bg-card">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{title}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => {
                onOpenChange(false);
                navigate('/accounts');
              }}
              className="text-muted-foreground hover:text-foreground h-6 w-6"
              title="Edit Accounts"
            >
              <Pencil className="size-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground h-7 w-7 rounded-full"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* 3-Column Responsive Account Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-4 flex-1 overflow-y-auto">
          {visibleAccounts.map((acc) => {
            const isSelected = selectedAccountId === acc.id;
            const groupMeta = ACCOUNT_GROUPS.find((g) => g.id === acc.group);
            const balance = getAccountBalance(acc);

            return (
              <div
                key={acc.id}
                onClick={() => {
                  onSelect(acc);
                  onOpenChange(false);
                }}
                className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center cursor-pointer transition-all active:scale-95 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/40 bg-primary/5 font-bold shadow-xs'
                    : 'border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border'
                }`}
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-background text-lg shadow-2xs mb-1.5">
                  {groupMeta?.icon || '🏦'}
                </div>
                <span className="text-xs font-semibold text-foreground truncate w-full px-1">
                  {acc.name}
                </span>
                <span
                  className={`text-[11px] font-mono tabular-nums font-bold mt-0.5 truncate w-full px-1 ${
                    acc.group === 'loan' || acc.group === 'overdraft' || (acc.group === 'card' && balance < 0)
                      ? 'text-expense'
                      : 'text-foreground'
                  }`}
                >
                  {formatCurrency(balance, { currency, showSymbol: true })}
                </span>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
