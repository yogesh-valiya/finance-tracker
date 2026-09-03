import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountStore } from './accountStore';
import { useAuthStore } from '../auth/authStore';
import { AddAccountModal } from './AddAccountModal';
import { ACCOUNT_GROUPS } from '@/types';
import type { Account, AccountGroup } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BarChart2,
  Plus,
  MoreVertical,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowUpDown,
  CreditCard,
  Pencil,
  ChevronDown,
} from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';

export const AccountsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const {
    accounts,
    isLoading,
    fetchAccounts,
    getAccountBalance,
    getGroupBalance,
    getNetWorthSummary,
    getCreditCardMetrics,
  } = useAccountStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const { totalAssets, totalLiabilities, netWorth } = getNetWorthSummary();
  const activeCurrency = preferences?.main_currency || 'INR';

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Group active accounts (excluding hidden ones for primary view)
  const visibleAccounts = accounts.filter((a) => !a.is_hidden);

  return (
    <div className="flex flex-col gap-3.5 p-4 pt-4 pb-20">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold text-foreground leading-tight">
            Accounts
          </h1>
          <p className="text-[10px] text-muted-foreground">
            Assets, Liabilities & Net Worth
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Statistics Shortcut Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/accounts/stats')}
            className="text-muted-foreground hover:text-foreground h-8 w-8"
            title="Account Statistics & Trends"
          >
            <BarChart2 className="size-4" />
          </Button>

          {/* Quick Add Button */}
          <Button
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            className="h-8 px-2.5 gap-1 text-xs font-semibold"
          >
            <Plus className="size-3.5" />
            Add
          </Button>

          {/* Overflow Options Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                title="Options Menu"
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem
                onClick={() => setIsAddModalOpen(true)}
                className="text-xs font-semibold gap-2 py-2 cursor-pointer"
              >
                <Plus className="size-3.5" />
                Add Account
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/accounts/reorder')}
                className="text-xs font-semibold gap-2 py-2 cursor-pointer"
              >
                <ArrowUpDown className="size-3.5" />
                Modify Orders
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigate('/accounts/visibility')}
                className="text-xs font-semibold gap-2 py-2 cursor-pointer"
              >
                <Eye className="size-3.5" />
                Show / Hide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Consolidated Net Worth Balance Sheet Header Card */}
      <Card className="border-border/60 bg-card shadow-2xs overflow-hidden">
        <CardContent className="flex flex-col p-3.5 gap-2.5">
          {/* Top Asset & Liability Breakdown */}
          <div className="grid grid-cols-2 gap-2 border-b border-border/40 pb-2.5">
            {/* Assets */}
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assets
              </span>
              <span className="text-sm font-bold font-mono text-income tabular-nums">
                {formatCurrency(totalAssets, { currency: activeCurrency })}
              </span>
            </div>

            {/* Liabilities */}
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Liabilities
              </span>
              <span className="text-sm font-bold font-mono text-expense tabular-nums">
                {formatCurrency(totalLiabilities, { currency: activeCurrency })}
              </span>
            </div>
          </div>

          {/* Consolidated Total Net Worth */}
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs font-bold text-foreground">
              Total Net Worth
            </span>
            <span className="text-base font-extrabold font-mono text-foreground tabular-nums">
              {formatCurrency(netWorth, { currency: activeCurrency })}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 11 Classification Group Sections */}
      <div className="flex flex-col gap-3">
        {ACCOUNT_GROUPS.map((group) => {
          const groupAccounts = visibleAccounts.filter((a) => a.group === group.id);
          const totalGroupBalance = getGroupBalance(group.id);
          const isCollapsed = collapsedGroups[group.id] || false;

          // Don't render empty groups unless user has no accounts at all
          if (groupAccounts.length === 0) return null;

          return (
            <div
              key={group.id}
              className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs"
            >
              {/* Group Accordion Header */}
              <div
                onClick={() => toggleGroupCollapse(group.id)}
                className="flex items-center justify-between px-3.5 py-2.5 bg-muted/20 border-b border-border/40 cursor-pointer hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{group.icon}</span>
                  <span className="text-xs font-bold text-foreground">
                    {group.name}
                  </span>
                  <Badge
                    variant="secondary"
                    className="text-[9px] px-1 py-0 h-4 font-semibold text-muted-foreground"
                  >
                    {groupAccounts.length}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-xs font-bold font-mono tabular-nums ${
                    group.isLiability ? 'text-expense' : 'text-foreground'
                  }`}>
                    {formatCurrency(totalGroupBalance, { currency: activeCurrency })}
                  </span>
                  <ChevronDown
                    className={`size-3.5 text-muted-foreground transition-transform ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Account Item Rows */}
              {!isCollapsed && (
                <div className="divide-y divide-border/40">
                  {groupAccounts.map((account) => {
                    const balance = getAccountBalance(account);
                    const ccMetrics = account.group === 'card' ? getCreditCardMetrics(account) : null;

                    return (
                      <div
                        key={account.id}
                        onClick={() => navigate(`/accounts/${account.id}`)}
                        className="flex items-center justify-between px-3.5 py-2.5 hover:bg-accent/40 cursor-pointer transition-colors"
                      >
                        {/* Left Info */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-secondary/80 text-sm shadow-2xs">
                            <span>{group.icon}</span>
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-foreground truncate">
                                {account.name}
                              </span>
                              {!account.include_in_totals && (
                                <Badge variant="outline" className="text-[8.5px] px-1 py-0 h-3.5 text-muted-foreground font-normal">
                                  Excluded
                                </Badge>
                              )}
                            </div>

                            {/* Credit Card Dual Metrics Sub-detail */}
                            {ccMetrics ? (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground leading-tight">
                                <span>Billed: <strong className="text-expense font-mono">{formatCurrency(ccMetrics.statementBalance, { currency: activeCurrency })}</strong></span>
                                <span className="text-muted-foreground/40">•</span>
                                <span>{ccMetrics.paymentDueText}</span>
                              </div>
                            ) : account.description ? (
                              <span className="text-[10px] text-muted-foreground truncate leading-tight">
                                {account.description}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {/* Right Balance & Edit action */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold font-mono tabular-nums ${
                              account.group === 'loan' || account.group === 'overdraft' || (account.group === 'card' && balance < 0)
                                ? 'text-expense'
                                : 'text-foreground'
                            }`}>
                              {formatCurrency(balance, { currency: activeCurrency })}
                            </span>
                            {ccMetrics && ccMetrics.outstandingBalance !== ccMetrics.statementBalance && (
                              <span className="text-[9.5px] font-mono text-muted-foreground">
                                Outst: {formatCurrency(ccMetrics.outstandingBalance, { currency: activeCurrency })}
                              </span>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/accounts/${account.id}/info`);
                            }}
                            className="text-muted-foreground hover:text-primary h-6 w-6"
                            title="Account Settings"
                          >
                            <Pencil className="size-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Account Modal Wizard */}
      <AddAccountModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSuccess={() => fetchAccounts()}
      />
    </div>
  );
};
