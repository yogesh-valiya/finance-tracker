import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountStore } from './accountStore';
import { useAuthStore } from '../auth/authStore';
import { ACCOUNT_GROUPS } from '@/types';
import type { Account } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';
import { toast } from 'sonner';

export const ModifyOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const { accounts, fetchAccounts, reorderAccounts, getAccountBalance } = useAccountStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const activeCurrency = preferences?.main_currency || 'INR';
  const selectedIndex = accounts.findIndex((a) => a.id === selectedId);

  const handleMove = async (direction: 'up' | 'down') => {
    if (selectedIndex === -1) return;
    const targetIndex = direction === 'up' ? selectedIndex - 1 : selectedIndex + 1;
    if (targetIndex < 0 || targetIndex >= accounts.length) return;

    const list = [...accounts];
    const [moved] = list.splice(selectedIndex, 1);
    list.splice(targetIndex, 0, moved);

    await reorderAccounts(list.map((a) => a.id));
    toast.success('Account order updated');
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 pt-4 pb-16">
      {/* Header Bar */}
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
          <div>
            <h1 className="text-base font-bold text-foreground leading-tight">
              Modify Orders
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Select an account and use arrows to reorder
            </p>
          </div>
        </div>

        {/* Up & Down Header Controls */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={selectedIndex <= 0}
            onClick={() => handleMove('up')}
            className="h-8 w-8 text-foreground"
            title="Move Up"
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={selectedIndex === -1 || selectedIndex >= accounts.length - 1}
            onClick={() => handleMove('down')}
            className="h-8 w-8 text-foreground"
            title="Move Down"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
      </div>

      {/* Account List */}
      <div className="flex flex-col rounded-xl border border-border/60 bg-card divide-y divide-border/40 overflow-hidden shadow-2xs">
        {accounts.map((account, index) => {
          const isSelected = selectedId === account.id;
          const groupMeta = ACCOUNT_GROUPS.find((g) => g.id === account.group);
          const balance = getAccountBalance(account);

          return (
            <div
              key={account.id}
              onClick={() => setSelectedId(account.id)}
              className={`flex items-center justify-between px-3.5 py-3 cursor-pointer transition-all ${
                isSelected
                  ? 'bg-primary/10 ring-1 ring-inset ring-primary'
                  : 'hover:bg-accent/40'
              }`}
            >
              {/* Left Details */}
              <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                <span className="text-[10px] font-mono text-muted-foreground w-4 text-center shrink-0">
                  {index + 1}
                </span>

                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary/80 text-sm shadow-2xs">
                  <span>{groupMeta?.icon || '🏦'}</span>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-foreground truncate">
                    {account.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground truncate">
                    {groupMeta?.name}
                  </span>
                </div>
              </div>

              {/* Right Balance & Selection Checkmark */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold font-mono text-foreground tabular-nums">
                  {formatCurrency(balance, { currency: activeCurrency })}
                </span>
                {isSelected && (
                  <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
