import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '../transactionStore';
import { useCategoryStore } from '@/features/categories/categoryStore';
import { useAccountStore } from '@/features/accounts/accountStore';
import { useAuthStore } from '@/features/auth/authStore';
import { RepeatModal } from './RepeatModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Plus, Repeat, Trash2, Tag, Calendar, CheckCircle2, PauseCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';
import { toast } from 'sonner';

export const RecurringManagerPage: React.FC = () => {
  const navigate = useNavigate();
  const { preferences } = useAuthStore();
  const { recurringRules, fetchRecurringRules, deleteRecurringRule, updateRecurringRule } =
    useTransactionStore();
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchRecurringRules();
  }, [fetchRecurringRules]);

  const activeCurrency = preferences?.main_currency || 'INR';

  const handleDelete = async (id: string) => {
    await deleteRecurringRule(id);
    toast.success('Recurring rule removed');
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await updateRecurringRule(id, { is_active: !current });
    toast.success(!current ? 'Rule activated' : 'Rule paused');
  };

  return (
    <div className="flex flex-col gap-4 p-4 pt-4 pb-20">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground -ml-2"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Repeat className="size-5 text-primary" />
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                Recurring ("Repeat") Rules
              </h1>
              <p className="text-[10px] text-muted-foreground">
                Automated recurring expense & income schedules
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="h-8 px-2.5 text-xs font-bold gap-1"
        >
          <Plus className="size-3.5" />
          New Rule
        </Button>
      </div>

      {/* Rules List */}
      <div className="flex flex-col gap-2.5">
        {recurringRules.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-border/60 bg-card shadow-2xs">
            <Repeat className="size-8 text-muted-foreground/40 mb-2" />
            <h3 className="text-xs font-bold text-foreground">No Recurring Schedules</h3>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">
              Set up recurring rules for rent, salaries, subscriptions, and EMIs to auto-generate ledger entries.
            </p>
          </Card>
        ) : (
          recurringRules.map((rule) => {
            const cat = categories.find((c) => c.id === rule.category);
            const isIncome = rule.type === 'income';

            return (
              <Card
                key={rule.id}
                className={`border-border/60 bg-card transition-all shadow-2xs ${
                  !rule.is_active ? 'opacity-60' : ''
                }`}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary/80 text-sm">
                      {cat?.icon ? <span>{cat.icon}</span> : <Tag className="size-3.5 text-muted-foreground" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-bold text-foreground truncate">
                          {rule.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] capitalize px-1 py-0 h-4">
                          {rule.frequency.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>Advance: {rule.advance_days} days</span>
                        <span>•</span>
                        <span>Next: {new Date(rule.next_run_date).toLocaleDateString('en-GB')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold font-mono tabular-nums ${
                        isIncome ? 'text-income' : 'text-expense'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatCurrency(rule.amount, { currency: activeCurrency })}
                    </span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleToggleActive(rule.id, rule.is_active)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title={rule.is_active ? 'Pause Rule' : 'Resume Rule'}
                    >
                      {rule.is_active ? (
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      ) : (
                        <PauseCircle className="size-4 text-muted-foreground" />
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(rule.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete Rule"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Repeat Modal */}
      <RepeatModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultData={{
          type: 'expense',
          amount: 5000,
          note: 'New Recurring Item',
        }}
      />
    </div>
  );
};
