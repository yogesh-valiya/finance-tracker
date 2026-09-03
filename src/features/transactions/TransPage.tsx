import React, { useEffect, useState } from 'react';
import { useTransactionStore } from './transactionStore';
import { useAccountStore } from '@/features/accounts/accountStore';
import { useCategoryStore } from '@/features/categories/categoryStore';
import { useAuthStore } from '@/features/auth/authStore';
import { DailyFeedView } from './feeds/DailyFeedView';
import { CalendarFeedView } from './feeds/CalendarFeedView';
import { MonthlySummaryView } from './feeds/MonthlySummaryView';
import { TotalAccountOverviewView } from './feeds/TotalAccountOverviewView';
import { NoteJournalView } from './feeds/NoteJournalView';
import { TransactionModal } from './forms/TransactionModal';
import { SearchModal } from './search/SearchModal';
import { FilterModal } from './filter/FilterModal';
import { BookmarksModal } from './bookmarks/BookmarksModal';
import type { Transaction } from '@/types';
import type { BookmarkTemplate } from './transactionStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Star,
  Plus,
  X,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '@/lib/financial-math';

export const TransPage: React.FC = () => {
  const { preferences } = useAuthStore();
  const {
    activePeriod,
    activeSubTab,
    filterState,
    setActivePeriod,
    setActiveSubTab,
    resetFilter,
    fetchTransactions,
    getMonthlySummary,
  } = useTransactionStore();
  const { fetchAccounts } = useAccountStore();
  const { fetchCategories } = useCategoryStore();

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isBookmarksOpen, setIsBookmarksOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchAccounts();
    fetchCategories();
  }, [fetchTransactions, fetchAccounts, fetchCategories]);

  const activeCurrency = preferences?.main_currency || 'INR';
  const summary = getMonthlySummary(activePeriod.year, activePeriod.month);

  const monthYearLabel = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(activePeriod.year, activePeriod.month, 1));

  const prevMonth = () => {
    if (activePeriod.month === 0) {
      setActivePeriod({ year: activePeriod.year - 1, month: 11 });
    } else {
      setActivePeriod({ year: activePeriod.year, month: activePeriod.month - 1 });
    }
  };

  const nextMonth = () => {
    if (activePeriod.month === 11) {
      setActivePeriod({ year: activePeriod.year + 1, month: 0 });
    } else {
      setActivePeriod({ year: activePeriod.year, month: activePeriod.month + 1 });
    }
  };

  const handleSelectTransactionToEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setIsTxModalOpen(true);
  };

  const handleQuickAdd = () => {
    setEditingTransaction(null);
    setIsTxModalOpen(true);
  };

  const handleSelectTemplate = (template: BookmarkTemplate) => {
    // Open transaction modal pre-filled with template
    setEditingTransaction({
      id: '',
      user: template.user,
      type: template.type,
      date: new Date().toISOString(),
      amount: template.amount,
      category: template.category,
      subcategory: template.subcategory,
      from_account: template.from_account,
      to_account: template.to_account,
      note: template.note,
      description: template.description,
      created: '',
      updated: '',
    } as Transaction);
    setIsTxModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-3 p-4 pt-4 pb-24">
      {/* Top Header Bar: Period Navigator + Actions */}
      <div className="flex items-center justify-between">
        {/* Month Navigator */}
        <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5 border border-border/40">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={prevMonth}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <span className="text-xs font-bold font-mono px-1.5">
            {monthYearLabel}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={nextMonth}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>

        {/* Header Actions: Bookmarks, Search, Filter */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsBookmarksOpen(true)}
            className="h-8 w-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
            title="Bookmarks"
          >
            <Star className="size-4 fill-amber-500/20" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsSearchOpen(true)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Search"
          >
            <Search className="size-4" />
          </Button>
          <Button
            type="button"
            variant={filterState.isActive ? 'secondary' : 'ghost'}
            size="icon-sm"
            onClick={() => setIsFilterOpen(true)}
            className={`h-8 w-8 ${
              filterState.isActive ? 'text-primary bg-primary/10 border border-primary/20' : 'text-muted-foreground hover:text-foreground'
            }`}
            title="Filter"
          >
            <SlidersHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Top Sub-Tabs Switcher */}
      <Tabs
        value={activeSubTab}
        onValueChange={(v) => setActiveSubTab(v as any)}
        className="w-full"
      >
        <TabsList className="grid grid-cols-5 w-full h-8 bg-muted/60 p-0.5 border border-border/40">
          <TabsTrigger value="daily" className="text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Daily
          </TabsTrigger>
          <TabsTrigger value="calendar" className="text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Calendar
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Monthly
          </TabsTrigger>
          <TabsTrigger value="total" className="text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Total
          </TabsTrigger>
          <TabsTrigger value="note" className="text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-xs">
            Note
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Active Filter Banner */}
      {filterState.isActive && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
          <div className="flex items-center gap-1.5 text-primary font-semibold">
            <SlidersHorizontal className="size-3" />
            <span>Active Filters Applied</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={resetFilter}
            className="h-5 px-1.5 text-[10px] text-primary hover:text-destructive gap-0.5"
          >
            <X className="size-3" />
            Clear
          </Button>
        </div>
      )}

      {/* Monthly Summary Strip (Only on Daily, Calendar, Note) */}
      {(activeSubTab === 'daily' || activeSubTab === 'calendar' || activeSubTab === 'note') && (
        <Card className="border-border/60 bg-card shadow-2xs">
          <CardContent className="grid grid-cols-3 gap-2 p-3 text-center">
            <div className="flex flex-col">
              <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
                Income
              </span>
              <span className="text-xs font-bold font-mono text-income tabular-nums">
                +{formatCurrency(summary.income, { currency: activeCurrency })}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
                Expenses
              </span>
              <span className="text-xs font-bold font-mono text-expense tabular-nums">
                -{formatCurrency(summary.expense, { currency: activeCurrency })}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[9.5px] uppercase font-semibold text-muted-foreground">
                Total
              </span>
              <span
                className={`text-xs font-bold font-mono tabular-nums ${
                  summary.total >= 0 ? 'text-foreground' : 'text-expense'
                }`}
              >
                {formatCurrency(summary.total, { currency: activeCurrency })}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Sub-Tab View Content */}
      <div className="pt-1">
        {activeSubTab === 'daily' && (
          <DailyFeedView onSelectTransaction={handleSelectTransactionToEdit} />
        )}
        {activeSubTab === 'calendar' && (
          <CalendarFeedView
            onSelectTransaction={handleSelectTransactionToEdit}
            onQuickAddDate={(d) => {
              setEditingTransaction(null);
              setIsTxModalOpen(true);
            }}
          />
        )}
        {activeSubTab === 'monthly' && <MonthlySummaryView />}
        {activeSubTab === 'total' && <TotalAccountOverviewView />}
        {activeSubTab === 'note' && (
          <NoteJournalView onSelectTransaction={handleSelectTransactionToEdit} />
        )}
      </div>

      {/* Floating Action Button (FAB) for Quick Add */}
      <Button
        type="button"
        size="icon"
        onClick={handleQuickAdd}
        className="fixed bottom-20 right-5 size-13 rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform z-40"
        title="Add Transaction"
      >
        <Plus className="size-6" />
      </Button>

      {/* Transaction Entry / Edit Modal */}
      <TransactionModal
        open={isTxModalOpen}
        onOpenChange={setIsTxModalOpen}
        transactionToEdit={editingTransaction}
        onSuccess={() => fetchTransactions()}
      />

      {/* Search Modal */}
      <SearchModal
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectTransaction={handleSelectTransactionToEdit}
      />

      {/* Multi-Dimensional Filter Modal */}
      <FilterModal
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
      />

      {/* Bookmarks Modal */}
      <BookmarksModal
        open={isBookmarksOpen}
        onOpenChange={setIsBookmarksOpen}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
};
