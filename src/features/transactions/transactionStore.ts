import { create } from 'zustand';
import { collections, pb } from '@/lib/pocketbase';
import type { Transaction, Account, Category, Subcategory } from '@/types';
import { toDecimal, Decimal } from '@/lib/financial-math';

export interface FilterCriteria {
  incomeCategories: string[]; // category IDs
  expenseCategories: string[]; // category IDs
  accounts: string[]; // account IDs
  types: ('expense' | 'income' | 'transfer')[];
  isActive: boolean;
}

export interface BookmarkTemplate {
  id: string;
  user: string;
  name: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  category?: string;
  subcategory?: string;
  from_account?: string;
  to_account?: string;
  note?: string;
  description?: string;
}

export interface RecurringRule {
  id: string;
  user: string;
  name: string;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  category?: string;
  subcategory?: string;
  from_account?: string;
  to_account?: string;
  note?: string;
  frequency: string; // 'daily' | 'weekdays' | 'weekends' | 'weekly' | 'biweekly' | 'monthly' | 'end_of_month' | 'yearly'
  advance_days: number; // 0 for on the date, 1-3 in advance
  start_date: string;
  next_run_date: string;
  end_type: 'never' | 'occurrences' | 'date';
  occurrences_left?: number;
  is_active: boolean;
}

interface TransactionState {
  transactions: Transaction[];
  bookmarks: BookmarkTemplate[];
  recurringRules: RecurringRule[];
  isLoading: boolean;
  error: string | null;

  activePeriod: { year: number; month: number }; // month is 0-indexed (0 = Jan, 11 = Dec)
  activeSubTab: 'daily' | 'calendar' | 'monthly' | 'total' | 'note';
  filterState: FilterCriteria;
  searchQuery: string;

  // Actions
  setActivePeriod: (period: { year: number; month: number }) => void;
  setActiveSubTab: (subTab: 'daily' | 'calendar' | 'monthly' | 'total' | 'note') => void;
  setSearchQuery: (query: string) => void;
  applyFilter: (filter: Partial<FilterCriteria>) => void;
  resetFilter: () => void;

  fetchTransactions: () => Promise<void>;
  createTransaction: (data: Partial<Transaction>) => Promise<Transaction>;
  updateTransaction: (id: string, partial: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (id: string) => Promise<Transaction>;

  // Bookmarks
  fetchBookmarks: () => Promise<void>;
  saveBookmark: (template: Omit<BookmarkTemplate, 'id' | 'user'>) => Promise<BookmarkTemplate>;
  deleteBookmark: (id: string) => Promise<void>;

  // Recurring Rules
  fetchRecurringRules: () => Promise<void>;
  createRecurringRule: (rule: Omit<RecurringRule, 'id' | 'user'>) => Promise<RecurringRule>;
  updateRecurringRule: (id: string, partial: Partial<RecurringRule>) => Promise<void>;
  deleteRecurringRule: (id: string) => Promise<void>;

  // Computed Aggregations
  getFilteredTransactions: () => Transaction[];
  getMonthlySummary: (year?: number, month?: number) => { income: number; expense: number; total: number };
  getDailyGroupedTransactions: (year?: number, month?: number) => {
    dateStr: string;
    date: Date;
    dayNum: number;
    dayName: string;
    monthYear: string;
    dayIncome: number;
    dayExpense: number;
    items: Transaction[];
  }[];
  getCalendarMatrix: (year?: number, month?: number) => {
    date: Date;
    dayNum: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    income: number;
    expense: number;
    net: number;
    items: Transaction[];
  }[];
  getAnnualMonthlySummary: (year?: number) => {
    year: number;
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    months: {
      monthNum: number;
      monthName: string;
      income: number;
      expense: number;
      net: number;
      weeks: {
        weekLabel: string;
        startDate: Date;
        endDate: Date;
        income: number;
        expense: number;
        net: number;
      }[];
    }[];
  };
  getPaymentBreakdown: (year?: number, month?: number) => {
    totalExpense: number;
    cashAccountsExpense: number;
    cardsPayExpense: number;
    transferVolume: number;
    lastMonthExpense: number;
    comparedPercentage: number;
  };
}

const defaultFilter: FilterCriteria = {
  incomeCategories: [],
  expenseCategories: [],
  accounts: [],
  types: ['expense', 'income', 'transfer'],
  isActive: false,
};

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  bookmarks: [],
  recurringRules: [],
  isLoading: false,
  error: null,

  activePeriod: {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  },
  activeSubTab: 'daily',
  filterState: defaultFilter,
  searchQuery: '',

  setActivePeriod: (period) => set({ activePeriod: period }),
  setActiveSubTab: (subTab) => set({ activeSubTab: subTab }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  applyFilter: (partial) => {
    const next = { ...get().filterState, ...partial, isActive: true };
    set({ filterState: next });
  },

  resetFilter: () => set({ filterState: defaultFilter }),

  fetchTransactions: async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const records = await collections.transactions().getFullList({
        filter: `user = "${userId}"`,
        sort: '-date',
        expand: 'category,subcategory,from_account,to_account',
      });

      set({ transactions: records as Transaction[], isLoading: false });
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      set({ error: err.message || 'Failed to fetch transactions', isLoading: false });
    }
  },

  createTransaction: async (data) => {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('Unauthenticated user');

    const created = await collections.transactions().create({
      user: userId,
      type: data.type || 'expense',
      date: data.date || new Date().toISOString(),
      amount: Number(data.amount) || 0,
      fee: Number(data.fee) || 0,
      category: data.category,
      subcategory: data.subcategory,
      from_account: data.from_account,
      to_account: data.to_account,
      note: data.note?.trim() || '',
      description: data.description?.trim() || '',
      photos: data.photos,
    });

    await get().fetchTransactions();
    return created as Transaction;
  },

  updateTransaction: async (id, partial) => {
    const updateData: Record<string, any> = {};
    if (partial.type !== undefined) updateData.type = partial.type;
    if (partial.date !== undefined) updateData.date = partial.date;
    if (partial.amount !== undefined) updateData.amount = Number(partial.amount);
    if (partial.fee !== undefined) updateData.fee = Number(partial.fee);
    if (partial.category !== undefined) updateData.category = partial.category;
    if (partial.subcategory !== undefined) updateData.subcategory = partial.subcategory;
    if (partial.from_account !== undefined) updateData.from_account = partial.from_account;
    if (partial.to_account !== undefined) updateData.to_account = partial.to_account;
    if (partial.note !== undefined) updateData.note = partial.note.trim();
    if (partial.description !== undefined) updateData.description = partial.description.trim();
    if (partial.photos !== undefined) updateData.photos = partial.photos;

    await collections.transactions().update(id, updateData);
    await get().fetchTransactions();
  },

  deleteTransaction: async (id) => {
    await collections.transactions().delete(id);
    set({ transactions: get().transactions.filter((t) => t.id !== id) });
  },

  duplicateTransaction: async (id) => {
    const target = get().transactions.find((t) => t.id === id);
    if (!target) throw new Error('Transaction not found');

    const duplicate = await get().createTransaction({
      type: target.type,
      date: new Date().toISOString(),
      amount: target.amount,
      fee: target.fee,
      category: target.category,
      subcategory: target.subcategory,
      from_account: target.from_account,
      to_account: target.to_account,
      note: target.note,
      description: target.description,
    });

    return duplicate;
  },

  fetchBookmarks: async () => {
    // In local demo or PocketBase, fallback to local storage if collection not present
    const raw = localStorage.getItem('mm_bookmarks');
    if (raw) {
      try {
        set({ bookmarks: JSON.parse(raw) });
      } catch {}
    }
  },

  saveBookmark: async (template) => {
    const userId = pb.authStore.model?.id || 'demo_user';
    const newBookmark: BookmarkTemplate = {
      ...template,
      id: `bm_${Date.now()}`,
      user: userId,
    };
    const updated = [newBookmark, ...get().bookmarks];
    set({ bookmarks: updated });
    localStorage.setItem('mm_bookmarks', JSON.stringify(updated));
    return newBookmark;
  },

  deleteBookmark: async (id) => {
    const updated = get().bookmarks.filter((b) => b.id !== id);
    set({ bookmarks: updated });
    localStorage.setItem('mm_bookmarks', JSON.stringify(updated));
  },

  fetchRecurringRules: async () => {
    const raw = localStorage.getItem('mm_recurring_rules');
    if (raw) {
      try {
        set({ recurringRules: JSON.parse(raw) });
      } catch {}
    }
  },

  createRecurringRule: async (rule) => {
    const userId = pb.authStore.model?.id || 'demo_user';
    const newRule: RecurringRule = {
      ...rule,
      id: `rr_${Date.now()}`,
      user: userId,
    };
    const updated = [newRule, ...get().recurringRules];
    set({ recurringRules: updated });
    localStorage.setItem('mm_recurring_rules', JSON.stringify(updated));
    return newRule;
  },

  updateRecurringRule: async (id, partial) => {
    const updated = get().recurringRules.map((r) =>
      r.id === id ? { ...r, ...partial } : r
    );
    set({ recurringRules: updated });
    localStorage.setItem('mm_recurring_rules', JSON.stringify(updated));
  },

  deleteRecurringRule: async (id) => {
    const updated = get().recurringRules.filter((r) => r.id !== id);
    set({ recurringRules: updated });
    localStorage.setItem('mm_recurring_rules', JSON.stringify(updated));
  },

  getFilteredTransactions: () => {
    const { transactions, filterState, searchQuery } = get();

    return transactions.filter((t) => {
      // 1. Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const noteMatch = t.note?.toLowerCase().includes(q);
        const descMatch = t.description?.toLowerCase().includes(q);
        const catMatch = t.expand?.category?.name?.toLowerCase().includes(q);
        const subcatMatch = t.expand?.subcategory?.name?.toLowerCase().includes(q);
        const accMatch =
          t.expand?.from_account?.name?.toLowerCase().includes(q) ||
          t.expand?.to_account?.name?.toLowerCase().includes(q);

        if (!noteMatch && !descMatch && !catMatch && !subcatMatch && !accMatch) {
          return false;
        }
      }

      // 2. Filter Criteria
      if (filterState.isActive) {
        if (!filterState.types.includes(t.type)) return false;

        if (t.type === 'expense' && filterState.expenseCategories.length > 0) {
          if (!t.category || !filterState.expenseCategories.includes(t.category)) {
            return false;
          }
        }

        if (t.type === 'income' && filterState.incomeCategories.length > 0) {
          if (!t.category || !filterState.incomeCategories.includes(t.category)) {
            return false;
          }
        }

        if (filterState.accounts.length > 0) {
          const matchedFrom = t.from_account && filterState.accounts.includes(t.from_account);
          const matchedTo = t.to_account && filterState.accounts.includes(t.to_account);
          if (!matchedFrom && !matchedTo) return false;
        }
      }

      return true;
    });
  },

  getMonthlySummary: (year, month) => {
    const targetYear = year !== undefined ? year : get().activePeriod.year;
    const targetMonth = month !== undefined ? month : get().activePeriod.month;
    const list = get().getFilteredTransactions();

    let income = new Decimal(0);
    let expense = new Decimal(0);

    for (const t of list) {
      const d = new Date(t.date);
      if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
        const amt = toDecimal(t.amount);
        if (t.type === 'income') income = income.plus(amt);
        if (t.type === 'expense') expense = expense.plus(amt);
      }
    }

    const total = income.minus(expense);
    return {
      income: income.toNumber(),
      expense: expense.toNumber(),
      total: total.toNumber(),
    };
  },

  getDailyGroupedTransactions: (year, month) => {
    const targetYear = year !== undefined ? year : get().activePeriod.year;
    const targetMonth = month !== undefined ? month : get().activePeriod.month;
    const list = get().getFilteredTransactions();

    const monthTransactions = list.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });

    const groups: ReturnType<TransactionState['getDailyGroupedTransactions']> = [];
    const dateMap = new Map<string, Transaction[]>();

    for (const t of monthTransactions) {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const existing = dateMap.get(key) || [];
      existing.push(t);
      dateMap.set(key, existing);
    }

    for (const [key, items] of dateMap.entries()) {
      const firstDate = new Date(items[0].date);
      let dayIncome = new Decimal(0);
      let dayExpense = new Decimal(0);

      for (const t of items) {
        const amt = toDecimal(t.amount);
        if (t.type === 'income') dayIncome = dayIncome.plus(amt);
        if (t.type === 'expense') dayExpense = dayExpense.plus(amt);
      }

      groups.push({
        dateStr: key,
        date: firstDate,
        dayNum: firstDate.getDate(),
        dayName: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(firstDate),
        monthYear: new Intl.DateTimeFormat('en-US', { month: '2-digit', year: 'numeric' }).format(firstDate),
        dayIncome: dayIncome.toNumber(),
        dayExpense: dayExpense.toNumber(),
        items: items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      });
    }

    return groups.sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  getCalendarMatrix: (year, month) => {
    const targetYear = year !== undefined ? year : get().activePeriod.year;
    const targetMonth = month !== undefined ? month : get().activePeriod.month;
    const list = get().getFilteredTransactions();

    const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun, 6 = Sat

    // Calendar grid start date
    const gridStart = new Date(targetYear, targetMonth, 1 - startDayOfWeek);
    const today = new Date();

    const cells: ReturnType<TransactionState['getCalendarMatrix']> = [];

    for (let i = 0; i < 35; i++) {
      const cellDate = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
      const isCurrentMonth = cellDate.getMonth() === targetMonth;
      const isToday =
        cellDate.getDate() === today.getDate() &&
        cellDate.getMonth() === today.getMonth() &&
        cellDate.getFullYear() === today.getFullYear();

      // Find transactions on this cellDate
      const dayItems = list.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getFullYear() === cellDate.getFullYear() &&
          d.getMonth() === cellDate.getMonth() &&
          d.getDate() === cellDate.getDate()
        );
      });

      let inc = new Decimal(0);
      let exp = new Decimal(0);

      for (const t of dayItems) {
        const amt = toDecimal(t.amount);
        if (t.type === 'income') inc = inc.plus(amt);
        if (t.type === 'expense') exp = exp.plus(amt);
      }

      cells.push({
        date: cellDate,
        dayNum: cellDate.getDate(),
        isCurrentMonth,
        isToday,
        income: inc.toNumber(),
        expense: exp.toNumber(),
        net: inc.minus(exp).toNumber(),
        items: dayItems,
      });
    }

    return cells;
  },

  getAnnualMonthlySummary: (year) => {
    const targetYear = year !== undefined ? year : get().activePeriod.year;
    const list = get().getFilteredTransactions();

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    const months = Array.from({ length: 12 }, (_, mIdx) => {
      const monthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(
        new Date(targetYear, mIdx, 1)
      );

      let mIncome = new Decimal(0);
      let mExpense = new Decimal(0);

      const mItems = list.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === targetYear && d.getMonth() === mIdx;
      });

      for (const t of mItems) {
        const amt = toDecimal(t.amount);
        if (t.type === 'income') mIncome = mIncome.plus(amt);
        if (t.type === 'expense') mExpense = mExpense.plus(amt);
      }

      totalIncome = totalIncome.plus(mIncome);
      totalExpense = totalExpense.plus(mExpense);

      // Generate 4-5 weekly drilldown intervals for this month
      const daysInMonth = new Date(targetYear, mIdx + 1, 0).getDate();
      const weeks = [];
      let weekStartDay = 1;
      let weekIndex = 1;

      while (weekStartDay <= daysInMonth) {
        const weekEndDay = Math.min(weekStartDay + 6, daysInMonth);
        const wStart = new Date(targetYear, mIdx, weekStartDay);
        const wEnd = new Date(targetYear, mIdx, weekEndDay);

        let wIncome = new Decimal(0);
        let wExpense = new Decimal(0);

        for (const t of mItems) {
          const d = new Date(t.date);
          if (d.getDate() >= weekStartDay && d.getDate() <= weekEndDay) {
            const amt = toDecimal(t.amount);
            if (t.type === 'income') wIncome = wIncome.plus(amt);
            if (t.type === 'expense') wExpense = wExpense.plus(amt);
          }
        }

        weeks.push({
          weekLabel: `Week ${weekIndex} (${weekStartDay.toString().padStart(2, '0')}/${(mIdx + 1).toString().padStart(2, '0')} ~ ${weekEndDay.toString().padStart(2, '0')}/${(mIdx + 1).toString().padStart(2, '0')})`,
          startDate: wStart,
          endDate: wEnd,
          income: wIncome.toNumber(),
          expense: wExpense.toNumber(),
          net: wIncome.minus(wExpense).toNumber(),
        });

        weekStartDay += 7;
        weekIndex++;
      }

      return {
        monthNum: mIdx + 1,
        monthName,
        income: mIncome.toNumber(),
        expense: mExpense.toNumber(),
        net: mIncome.minus(mExpense).toNumber(),
        weeks,
      };
    });

    return {
      year: targetYear,
      totalIncome: totalIncome.toNumber(),
      totalExpense: totalExpense.toNumber(),
      netSavings: totalIncome.minus(totalExpense).toNumber(),
      months,
    };
  },

  getPaymentBreakdown: (year, month) => {
    const targetYear = year !== undefined ? year : get().activePeriod.year;
    const targetMonth = month !== undefined ? month : get().activePeriod.month;
    const list = get().transactions; // raw transactions for payment method breakdown

    let totalExpense = new Decimal(0);
    let cashAccountsExpense = new Decimal(0);
    let cardsPayExpense = new Decimal(0);
    let transferVolume = new Decimal(0);

    for (const t of list) {
      const d = new Date(t.date);
      if (d.getFullYear() === targetYear && d.getMonth() === targetMonth) {
        const amt = toDecimal(t.amount);
        if (t.type === 'expense') {
          totalExpense = totalExpense.plus(amt);
          const fromGroup = t.expand?.from_account?.group;
          if (fromGroup === 'card' || fromGroup === 'prepaid') {
            cardsPayExpense = cardsPayExpense.plus(amt);
          } else {
            cashAccountsExpense = cashAccountsExpense.plus(amt);
          }
        } else if (t.type === 'transfer') {
          transferVolume = transferVolume.plus(amt);
        }
      }
    }

    // Previous month comparison
    const prevMonthDate = new Date(targetYear, targetMonth - 1, 1);
    let lastMonthExpense = new Decimal(0);

    for (const t of list) {
      const d = new Date(t.date);
      if (d.getFullYear() === prevMonthDate.getFullYear() && d.getMonth() === prevMonthDate.getMonth()) {
        if (t.type === 'expense') {
          lastMonthExpense = lastMonthExpense.plus(toDecimal(t.amount));
        }
      }
    }

    let comparedPercentage = 0;
    if (!lastMonthExpense.isZero()) {
      comparedPercentage = totalExpense
        .minus(lastMonthExpense)
        .dividedBy(lastMonthExpense)
        .times(100)
        .toDecimalPlaces(1)
        .toNumber();
    }

    return {
      totalExpense: totalExpense.toNumber(),
      cashAccountsExpense: cashAccountsExpense.toNumber(),
      cardsPayExpense: cardsPayExpense.toNumber(),
      transferVolume: transferVolume.toNumber(),
      lastMonthExpense: lastMonthExpense.toNumber(),
      comparedPercentage,
    };
  },
}));
