export type AccountGroup =
  | 'cash'
  | 'accounts'
  | 'card'
  | 'debit_card'
  | 'savings'
  | 'prepaid'
  | 'investments'
  | 'overdraft'
  | 'loan'
  | 'insurance'
  | 'others';

export interface AccountGroupMeta {
  id: AccountGroup;
  name: string;
  isLiability: boolean;
  icon: string;
  description: string;
}

export const ACCOUNT_GROUPS: AccountGroupMeta[] = [
  { id: 'cash', name: 'Cash', isLiability: false, icon: '💵', description: 'Wallets & physical cash' },
  { id: 'accounts', name: 'Accounts', isLiability: false, icon: '🏦', description: 'Checking & salary bank accounts' },
  { id: 'card', name: 'Card', isLiability: true, icon: '💳', description: 'Credit cards with statement billing' },
  { id: 'debit_card', name: 'Debit Card', isLiability: false, icon: '🏧', description: 'Direct linked bank debit cards' },
  { id: 'savings', name: 'Savings', isLiability: false, icon: '🐖', description: 'High-yield & emergency savings' },
  { id: 'prepaid', name: 'Top-Up / Prepaid', isLiability: false, icon: '🎟️', description: 'Reloadable cards & transit passes' },
  { id: 'investments', name: 'Investments', isLiability: false, icon: '📈', description: 'Mutual funds, stocks & crypto' },
  { id: 'overdraft', name: 'Overdrafts', isLiability: true, icon: '📉', description: 'Credit line facility accounts' },
  { id: 'loan', name: 'Loan', isLiability: true, icon: '🏷️', description: 'Car, home & personal loans (negative balance)' },
  { id: 'insurance', name: 'Insurance', isLiability: false, icon: '🛡️', description: 'Life, health & property policies' },
  { id: 'others', name: 'Others', isLiability: false, icon: '📦', description: 'Miscellaneous asset & liability holdings' },
];

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created: string;
  updated: string;
}

export interface Account {
  id: string;
  user: string;
  name: string;
  group: AccountGroup;
  amount: number; // base / initial balance
  description?: string;
  include_in_totals: boolean;
  is_hidden: boolean;
  order: number;
  settlement_date?: number; // 1-31 for Credit Cards
  payment_date?: number; // 1-31 for Credit Cards
  linked_account?: string; // parent account for Debit Card
  created?: string;
  updated?: string;
}

export interface Category {
  id: string;
  user: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  order: number;
  subcategories?: Subcategory[];
  created?: string;
  updated?: string;
}

export interface Subcategory {
  id: string;
  user: string;
  category: string;
  name: string;
  order: number;
  created?: string;
  updated?: string;
}

export interface Transaction {
  id: string;
  user: string;
  type: TransactionType;
  date: string; // ISO format: YYYY-MM-DDTHH:mm:ss.sssZ
  amount: number;
  fee?: number; // Surcharge / fee for transfers
  category?: string; // Category ID
  subcategory?: string; // Subcategory ID
  from_account?: string; // Source account (Expense, Transfer)
  to_account?: string; // Destination account (Income, Transfer)
  note?: string;
  description?: string;
  photos?: string[];
  is_recurring?: boolean;
  recurring_rule?: string;
  is_bookmark?: boolean;
  created?: string;
  updated?: string;
  // Expanded relation objects (populated client-side or via PocketBase expand)
  expand?: {
    category?: Category;
    subcategory?: Subcategory;
    from_account?: Account;
    to_account?: Account;
  };
}

export interface Bookmark {
  id: string;
  user: string;
  name: string;
  type: TransactionType;
  amount?: number;
  category?: string;
  subcategory?: string;
  from_account?: string;
  to_account?: string;
  note?: string;
  description?: string;
  created?: string;
  updated?: string;
}

export type RecurrenceFrequency =
  | 'every_day'
  | 'weekdays'
  | 'weekend'
  | 'every_week'
  | 'every_2_weeks'
  | 'every_4_weeks'
  | 'every_month'
  | 'end_of_month'
  | 'every_2_month'
  | 'every_3_month'
  | 'every_4_month'
  | 'every_6_month'
  | 'annually';

export interface RecurringRule {
  id: string;
  user: string;
  type: TransactionType;
  frequency: RecurrenceFrequency;
  timing: 'on_date' | 'in_advance_1' | 'in_advance_2' | 'in_advance_3';
  start_date: string;
  last_posted_date?: string;
  next_run_date: string;
  amount: number;
  fee?: number;
  category?: string;
  subcategory?: string;
  from_account?: string;
  to_account?: string;
  note?: string;
  description?: string;
  is_active: boolean;
  created?: string;
  updated?: string;
}

export interface UserPreference {
  id: string;
  user: string;
  main_currency: string; // e.g. 'INR'
  sub_currency?: string;
  sub_currency_rate?: number;
  color_scheme: 'set_a' | 'set_b';
  start_screen: 'daily' | 'calendar';
  monthly_start_date: number; // 1-31
  weekly_start_day: 'sunday' | 'monday';
  carry_over: boolean;
  enable_subcategories: boolean;
  passcode?: string;
  is_passcode_enabled: boolean;
  is_biometrics_enabled: boolean;
  time_input_mode: 'manual' | 'auto';
  show_description: boolean;
  autocomplete: boolean;
  input_order: 'amount_first' | 'category_first';
  note_button: boolean;
  daily_reminder_time?: string;
  created?: string;
  updated?: string;
}
