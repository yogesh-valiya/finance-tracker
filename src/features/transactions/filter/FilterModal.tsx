import React, { useState } from 'react';
import { useTransactionStore } from '../transactionStore';
import { useCategoryStore } from '@/features/categories/categoryStore';
import { useAccountStore } from '@/features/accounts/accountStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { SlidersHorizontal, Check, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { filterState, applyFilter, resetFilter } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { accounts } = useAccountStore();

  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'account'>('expense');

  // Local selection states
  const [selectedIncomeCats, setSelectedIncomeCats] = useState<string[]>(filterState.incomeCategories);
  const [selectedExpenseCats, setSelectedExpenseCats] = useState<string[]>(filterState.expenseCategories);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(filterState.accounts);

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const visibleAccounts = accounts.filter((a) => !a.is_hidden);

  const toggleIncomeCat = (id: string) => {
    setSelectedIncomeCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleExpenseCat = (id: string) => {
    setSelectedExpenseCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllInTab = () => {
    if (activeTab === 'income') setSelectedIncomeCats(incomeCategories.map((c) => c.id));
    if (activeTab === 'expense') setSelectedExpenseCats(expenseCategories.map((c) => c.id));
    if (activeTab === 'account') setSelectedAccounts(visibleAccounts.map((a) => a.id));
  };

  const handleClearInTab = () => {
    if (activeTab === 'income') setSelectedIncomeCats([]);
    if (activeTab === 'expense') setSelectedExpenseCats([]);
    if (activeTab === 'account') setSelectedAccounts([]);
  };

  const handleApply = () => {
    const isAnyActive =
      selectedIncomeCats.length > 0 ||
      selectedExpenseCats.length > 0 ||
      selectedAccounts.length > 0;

    applyFilter({
      incomeCategories: selectedIncomeCats,
      expenseCategories: selectedExpenseCats,
      accounts: selectedAccounts,
      isActive: isAnyActive,
    });

    toast.success(isAnyActive ? 'Filters applied' : 'Filters cleared');
    onOpenChange(false);
  };

  const handleResetAll = () => {
    setSelectedIncomeCats([]);
    setSelectedExpenseCats([]);
    setSelectedAccounts([]);
    resetFilter();
    toast.info('All filters reset');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm rounded-3xl p-4 gap-3 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <span>Multi-Dimensional Filter</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleResetAll}
              className="text-[10px] text-muted-foreground hover:text-foreground h-6 gap-1"
            >
              <RotateCcw className="size-3" />
              Reset All
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Sub-Tabs: Income | Expense | Account */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full h-8 bg-muted/60 p-0.5 border border-border/40">
            <TabsTrigger value="expense" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Expense
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Income
            </TabsTrigger>
            <TabsTrigger value="account" className="text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
              Account
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Header Bulk Actions */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-muted-foreground font-semibold">
            {activeTab === 'expense'
              ? `${selectedExpenseCats.length} / ${expenseCategories.length} Selected`
              : activeTab === 'income'
              ? `${selectedIncomeCats.length} / ${incomeCategories.length} Selected`
              : `${selectedAccounts.length} / ${visibleAccounts.length} Selected`}
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              onClick={handleSelectAllInTab}
              className="h-6 text-[10px]"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={handleClearInTab}
              className="h-6 text-[10px]"
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Selection List */}
        <div className="flex flex-col gap-1.5 max-h-[45vh] overflow-y-auto pr-1">
          {activeTab === 'expense' &&
            expenseCategories.map((cat) => {
              const isChecked = selectedExpenseCats.includes(cat.id);

              return (
                <div
                  key={cat.id}
                  onClick={() => toggleExpenseCat(cat.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary/10 border-primary/40 font-semibold'
                      : 'bg-card border-border/60 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon || '🏷️'}</span>
                    <span className="text-xs text-foreground">{cat.name}</span>
                  </div>
                  <Checkbox checked={isChecked} onCheckedChange={() => toggleExpenseCat(cat.id)} />
                </div>
              );
            })}

          {activeTab === 'income' &&
            incomeCategories.map((cat) => {
              const isChecked = selectedIncomeCats.includes(cat.id);

              return (
                <div
                  key={cat.id}
                  onClick={() => toggleIncomeCat(cat.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary/10 border-primary/40 font-semibold'
                      : 'bg-card border-border/60 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat.icon || '💰'}</span>
                    <span className="text-xs text-foreground">{cat.name}</span>
                  </div>
                  <Checkbox checked={isChecked} onCheckedChange={() => toggleIncomeCat(cat.id)} />
                </div>
              );
            })}

          {activeTab === 'account' &&
            visibleAccounts.map((acc) => {
              const isChecked = selectedAccounts.includes(acc.id);

              return (
                <div
                  key={acc.id}
                  onClick={() => toggleAccount(acc.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-primary/10 border-primary/40 font-semibold'
                      : 'bg-card border-border/60 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🏦</span>
                    <span className="text-xs text-foreground">{acc.name}</span>
                  </div>
                  <Checkbox checked={isChecked} onCheckedChange={() => toggleAccount(acc.id)} />
                </div>
              );
            })}
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs font-semibold flex-1"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="h-8 text-xs font-bold flex-1"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
