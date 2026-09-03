import { create } from 'zustand';
import { collections, pb } from '@/lib/pocketbase';
import type { Account, AccountGroup, Transaction } from '@/types';
import {
  calculateAccountBalance,
  calculateNetWorth,
  toDecimal,
  Decimal,
} from '@/lib/financial-math';

interface CreateAccountParams {
  name: string;
  group: AccountGroup;
  amount: number;
  description?: string;
  include_in_totals?: boolean;
  settlement_date?: number;
  payment_date?: number;
  linked_account?: string;
}

interface AccountState {
  accounts: Account[];
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  createAccount: (
    params: CreateAccountParams,
    recordDifferenceAsTransaction?: boolean
  ) => Promise<Account>;
  updateAccount: (
    id: string,
    partial: Partial<Account>,
    recordDifference?: boolean,
    oldAmount?: number
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  reorderAccounts: (accountIds: string[]) => Promise<void>;
  toggleVisibility: (id: string) => Promise<void>;

  // Computed Financial Metrics
  getAccountBalance: (account: Account, txList?: Transaction[]) => number;
  getGroupBalance: (group: AccountGroup) => number;
  getNetWorthSummary: () => {
    totalAssets: number;
    totalLiabilities: number;
    netWorth: number;
  };
  getCreditCardMetrics: (account: Account) => {
    statementBalance: number;
    outstandingBalance: number;
    billingCycleText: string;
    paymentDueText: string;
  };
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  transactions: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) return;

    set({ isLoading: true, error: null });
    try {
      const [accs, trans] = await Promise.all([
        collections.accounts().getFullList({
          filter: `user = "${userId}"`,
          sort: 'order',
        }),
        collections.transactions().getFullList({
          filter: `user = "${userId}"`,
          sort: '-date',
        }),
      ]);

      set({ accounts: accs, transactions: trans, isLoading: false });
    } catch (err: any) {
      console.error('Error loading accounts:', err);
      set({ error: err.message || 'Failed to load accounts', isLoading: false });
    }
  },

  createAccount: async (params, recordDifferenceAsTransaction = false) => {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('Unauthenticated user');

    const nextOrder = get().accounts.length;
    const initialAmount = Number(params.amount) || 0;

    const created = await collections.accounts().create({
      user: userId,
      name: params.name.trim(),
      group: params.group,
      amount: initialAmount,
      description: params.description?.trim() || '',
      include_in_totals: params.include_in_totals ?? true,
      is_hidden: false,
      order: nextOrder,
      settlement_date: params.settlement_date,
      payment_date: params.payment_date,
      linked_account: params.linked_account,
    });

    if (recordDifferenceAsTransaction && initialAmount !== 0) {
      try {
        if (initialAmount > 0) {
          await collections.transactions().create({
            user: userId,
            type: 'income',
            date: new Date().toISOString(),
            amount: Math.abs(initialAmount),
            to_account: created.id,
            note: 'Initial Balance',
            description: `Initial opening balance for ${created.name}`,
          });
        } else {
          await collections.transactions().create({
            user: userId,
            type: 'expense',
            date: new Date().toISOString(),
            amount: Math.abs(initialAmount),
            from_account: created.id,
            note: 'Initial Liability / Balance Adjustment',
            description: `Initial liability balance for ${created.name}`,
          });
        }
      } catch (transErr) {
        console.warn('Could not create initial balance transaction:', transErr);
      }
    }

    await get().fetchAccounts();
    return created;
  },

  updateAccount: async (id, partial, recordDifference = false, oldAmount) => {
    const userId = pb.authStore.model?.id;
    if (!userId) throw new Error('Unauthenticated user');

    const prevAccount = get().accounts.find((a) => a.id === id);
    const prevAmount = oldAmount !== undefined ? oldAmount : (prevAccount?.amount || 0);

    const data: Record<string, any> = {};
    if (partial.name !== undefined) data.name = partial.name.trim();
    if (partial.group !== undefined) data.group = partial.group;
    if (partial.amount !== undefined) data.amount = Number(partial.amount);
    if (partial.description !== undefined) data.description = partial.description.trim();
    if (partial.include_in_totals !== undefined) data.include_in_totals = partial.include_in_totals;
    if (partial.is_hidden !== undefined) data.is_hidden = partial.is_hidden;
    if (partial.order !== undefined) data.order = partial.order;
    if (partial.settlement_date !== undefined) data.settlement_date = partial.settlement_date;
    if (partial.payment_date !== undefined) data.payment_date = partial.payment_date;
    if (partial.linked_account !== undefined) data.linked_account = partial.linked_account;

    await collections.accounts().update(id, data);

    if (recordDifference && partial.amount !== undefined && prevAccount) {
      const diff = toDecimal(partial.amount).minus(toDecimal(prevAmount)).toNumber();
      if (diff !== 0) {
        try {
          if (diff > 0) {
            await collections.transactions().create({
              user: userId,
              type: 'income',
              date: new Date().toISOString(),
              amount: Math.abs(diff),
              to_account: id,
              note: 'Balance Adjustment',
              description: `Balance increased by ${Math.abs(diff)}`,
            });
          } else {
            await collections.transactions().create({
              user: userId,
              type: 'expense',
              date: new Date().toISOString(),
              amount: Math.abs(diff),
              from_account: id,
              note: 'Balance Adjustment',
              description: `Balance decreased by ${Math.abs(diff)}`,
            });
          }
        } catch (transErr) {
          console.warn('Could not record balance adjustment transaction:', transErr);
        }
      }
    }

    await get().fetchAccounts();
  },

  deleteAccount: async (id) => {
    await collections.accounts().delete(id);
    set({
      accounts: get().accounts.filter((a) => a.id !== id),
    });
  },

  reorderAccounts: async (accountIds) => {
    const currentList = get().accounts;
    const reordered = accountIds
      .map((id, index) => {
        const item = currentList.find((a) => a.id === id);
        return item ? { ...item, order: index } : null;
      })
      .filter((Boolean as unknown) as (x: any) => x is Account);

    set({ accounts: reordered });

    Promise.all(
      accountIds.map((id, index) =>
        collections.accounts().update(id, { order: index })
      )
    ).catch((err) => console.error('Error persisting account order:', err));
  },

  toggleVisibility: async (id) => {
    const account = get().accounts.find((a) => a.id === id);
    if (!account) return;

    const nextHidden = !account.is_hidden;
    await collections.accounts().update(id, { is_hidden: nextHidden });
    set({
      accounts: get().accounts.map((a) =>
        a.id === id ? { ...a, is_hidden: nextHidden } : a
      ),
    });
  },

  getAccountBalance: (account: Account, txList?: Transaction[]) => {
    const transactions = txList || get().transactions;
    let income = new Decimal(0);
    let expense = new Decimal(0);
    let transferIn = new Decimal(0);
    let transferOut = new Decimal(0);

    for (const t of transactions) {
      const amt = toDecimal(t.amount);
      const fee = toDecimal(t.fee || 0);

      if (t.type === 'income' && t.to_account === account.id) {
        income = income.plus(amt);
      } else if (t.type === 'expense' && t.from_account === account.id) {
        expense = expense.plus(amt);
      } else if (t.type === 'transfer') {
        if (t.to_account === account.id) transferIn = transferIn.plus(amt);
        if (t.from_account === account.id) transferOut = transferOut.plus(amt.plus(fee));
      }
    }

    return calculateAccountBalance(account.amount, income, expense, transferIn, transferOut).toNumber();
  },

  getGroupBalance: (group: AccountGroup) => {
    const groupAccounts = get().accounts.filter((a) => a.group === group);
    return groupAccounts.reduce((acc, a) => {
      return toDecimal(acc).plus(toDecimal(get().getAccountBalance(a))).toNumber();
    }, 0);
  },

  getNetWorthSummary: () => {
    const accounts = get().accounts;
    const assets: { balance: number; includeInTotals?: boolean }[] = [];
    const liabilities: { balance: number; includeInTotals?: boolean }[] = [];

    const liabilityGroups: AccountGroup[] = ['card', 'loan', 'overdraft'];

    for (const acc of accounts) {
      const bal = get().getAccountBalance(acc);
      const item = {
        balance: bal,
        includeInTotals: acc.include_in_totals,
      };
      if (liabilityGroups.includes(acc.group)) {
        liabilities.push(item);
      } else {
        assets.push(item);
      }
    }

    const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(assets, liabilities);
    return {
      totalAssets: totalAssets.toNumber(),
      totalLiabilities: totalLiabilities.toNumber(),
      netWorth: netWorth.toNumber(),
    };
  },

  getCreditCardMetrics: (account: Account) => {
    const transactions = get().transactions.filter(
      (t) => t.from_account === account.id || t.to_account === account.id
    );

    const totalBalance = get().getAccountBalance(account);
    const outstandingBalance = Math.abs(totalBalance);

    const settlementDate = account.settlement_date || 1;
    const paymentDate = account.payment_date || 1;

    const now = new Date();
    const currentDay = now.getDate();
    let statementCutoff: Date;

    if (currentDay >= settlementDate) {
      statementCutoff = new Date(now.getFullYear(), now.getMonth(), settlementDate, 23, 59, 59);
    } else {
      statementCutoff = new Date(now.getFullYear(), now.getMonth() - 1, settlementDate, 23, 59, 59);
    }

    const billedTransactions = transactions.filter(
      (t) => new Date(t.date).getTime() <= statementCutoff.getTime()
    );
    const statementNet = get().getAccountBalance(account, billedTransactions);
    const statementBalance = Math.abs(statementNet);

    const prevMonthName = new Intl.DateTimeFormat('en-US', { month: '2-digit' }).format(
      new Date(now.getFullYear(), now.getMonth() - 1, 1)
    );
    const currentMonthName = new Intl.DateTimeFormat('en-US', { month: '2-digit' }).format(now);
    const nextMonthName = new Intl.DateTimeFormat('en-US', { month: '2-digit' }).format(
      new Date(now.getFullYear(), now.getMonth() + 1, 1)
    );

    return {
      statementBalance,
      outstandingBalance,
      billingCycleText: `${settlementDate.toString().padStart(2, '0')}/${prevMonthName} ~ ${(settlementDate - 1 || 30).toString().padStart(2, '0')}/${currentMonthName}`,
      paymentDueText: `Pay: ${paymentDate.toString().padStart(2, '0')}/${nextMonthName}`,
    };
  },
}));
