import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccountStore } from './accountStore';
import { useAuthStore } from '../auth/authStore';
import { ACCOUNT_GROUPS } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';
import { toast } from 'sonner';

export const ShowHideSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const { accounts, fetchAccounts, toggleVisibility, getAccountBalance } = useAccountStore();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const activeCurrency = preferences?.main_currency || 'INR';

  const handleToggle = async (account: any) => {
    await toggleVisibility(account.id);
    toast.success(
      `Account "${account.name}" is now ${account.is_hidden ? 'visible' : 'hidden'}`
    );
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 pt-4 pb-16">
      {/* Top Header */}
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
              Show / Hide Settings
            </h1>
            <p className="text-[10px] text-muted-foreground">
              Toggle account visibility across feeds and selectors
            </p>
          </div>
        </div>
      </div>

      {/* Grouped Account List */}
      <div className="flex flex-col gap-3">
        {ACCOUNT_GROUPS.map((group) => {
          const groupAccounts = accounts.filter((a) => a.group === group.id);
          if (groupAccounts.length === 0) return null;

          return (
            <div
              key={group.id}
              className="flex flex-col rounded-xl border border-border/60 bg-card overflow-hidden shadow-2xs"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-muted/20 border-b border-border/40 text-xs font-bold text-foreground">
                <div className="flex items-center gap-2">
                  <span>{group.icon}</span>
                  <span>{group.name}</span>
                </div>
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 font-semibold text-muted-foreground">
                  {groupAccounts.length}
                </Badge>
              </div>

              {/* Account Rows with Eye Toggle */}
              <div className="divide-y divide-border/40">
                {groupAccounts.map((account) => {
                  const balance = getAccountBalance(account);
                  const isHidden = account.is_hidden;

                  return (
                    <div
                      key={account.id}
                      className="flex items-center justify-between px-3.5 py-2.5 hover:bg-accent/40 transition-colors"
                    >
                      {/* Left Info */}
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                        <div className={`flex flex-col min-w-0 ${isHidden ? 'opacity-50' : ''}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {account.name}
                            </span>
                            {isHidden && (
                              <Badge variant="outline" className="text-[8.5px] px-1 py-0 h-3.5 text-muted-foreground font-normal">
                                Hidden
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {formatCurrency(balance, { currency: activeCurrency })}
                          </span>
                        </div>
                      </div>

                      {/* Right Eye Toggle Button */}
                      <Button
                        variant={isHidden ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggle(account)}
                        className={`h-7 px-2.5 text-xs font-semibold gap-1.5 ${
                          isHidden
                            ? 'text-muted-foreground hover:text-foreground'
                            : 'text-primary'
                        }`}
                      >
                        {isHidden ? (
                          <>
                            <EyeOff className="size-3.5" />
                            <span>Hidden</span>
                          </>
                        ) : (
                          <>
                            <Eye className="size-3.5" />
                            <span>Visible</span>
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
