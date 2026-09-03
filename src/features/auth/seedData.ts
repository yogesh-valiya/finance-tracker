import { pb, collections } from '@/lib/pocketbase';
import type { AccountGroup } from '@/types';

export interface DefaultCategorySeed {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  subcategories?: string[];
}

export const DEFAULT_INCOME_CATEGORIES: DefaultCategorySeed[] = [
  { name: 'Allowance', type: 'income', icon: '🤑' },
  { name: 'Salary', type: 'income', icon: '💰' },
  { name: 'Petty cash', type: 'income', icon: '💵' },
  { name: 'Bonus', type: 'income', icon: '🏅' },
  { name: 'Other', type: 'income', icon: '💸' },
];

export const DEFAULT_EXPENSE_CATEGORIES: DefaultCategorySeed[] = [
  {
    name: 'Food',
    type: 'expense',
    icon: '🍜',
    subcategories: ['Lunch', 'Dinner', 'Eating out', 'Beverages'],
  },
  {
    name: 'Social Life',
    type: 'expense',
    icon: '🧑‍🤝‍🧑',
    subcategories: ['Friend', 'Fellowship', 'Alumni', 'Dues'],
  },
  { name: 'Pets', type: 'expense', icon: '🐶' },
  {
    name: 'Transport',
    type: 'expense',
    icon: '🚖',
    subcategories: ['Bus', 'Subway', 'Taxi', 'Car'],
  },
  {
    name: 'Culture',
    type: 'expense',
    icon: '🖼️',
    subcategories: ['Books', 'Movie', 'Music', 'Apps'],
  },
  {
    name: 'Household',
    type: 'expense',
    icon: '🪑',
    subcategories: ['Appliances', 'Furniture', 'Kitchen', 'Toiletries', 'Chandlery', 'Rent'],
  },
  {
    name: 'Apparel',
    type: 'expense',
    icon: '👔',
    subcategories: ['Clothing', 'Fashion', 'Shoes', 'Laundry'],
  },
  {
    name: 'Beauty',
    type: 'expense',
    icon: '💄',
    subcategories: ['Cosmetics', 'Makeup', 'Accessories', 'Beauty'],
  },
  {
    name: 'Health',
    type: 'expense',
    icon: '🏥',
    subcategories: ['Health', 'Yoga', 'Hospital', 'Medicine'],
  },
  {
    name: 'Education',
    type: 'expense',
    icon: '📚',
    subcategories: ['Schooling', 'Textbooks', 'School supplies', 'Academy'],
  },
  {
    name: 'EMI',
    type: 'expense',
    icon: '🏷️',
    subcategories: ['Car Loan', 'Home Loan'],
  },
  { name: 'Gift', type: 'expense', icon: '🎁' },
  { name: 'Other', type: 'expense', icon: '📦' },
];

export const DEFAULT_ACCOUNTS: { name: string; group: AccountGroup; amount: number; description: string }[] = [
  { name: 'Cash', group: 'cash', amount: 0, description: 'Physical cash and wallet' },
  { name: 'Bank Account', group: 'accounts', amount: 0, description: 'Primary checking and savings account' },
];

/**
 * Seeds a new user account with default categories, subcategories, initial accounts, and preferences.
 */
export async function seedUserMasterData(userId: string, mainCurrency: string = 'INR'): Promise<void> {
  // 1. Check if user already has seeded preferences
  try {
    const existingPrefs = await collections.userPreferences().getFirstListItem(`user = "${userId}"`);
    if (existingPrefs) {
      return; // Already seeded
    }
  } catch {
    // Not found, proceed with seeding
  }

  // 2. Create User Preferences
  await collections.userPreferences().create({
    user: userId,
    main_currency: mainCurrency,
    sub_currency: '',
    sub_currency_rate: 1,
    color_scheme: 'set_a',
    start_screen: 'daily',
    monthly_start_date: 1,
    weekly_start_day: 'sunday',
    carry_over: false,
    enable_subcategories: true,
    passcode: '',
    is_passcode_enabled: false,
    is_biometrics_enabled: false,
    time_input_mode: 'manual',
    show_description: false,
    autocomplete: true,
    input_order: 'amount_first',
    note_button: false,
    daily_reminder_time: '21:00',
  });

  // 3. Seed Accounts
  for (let i = 0; i < DEFAULT_ACCOUNTS.length; i++) {
    const acc = DEFAULT_ACCOUNTS[i];
    await collections.accounts().create({
      user: userId,
      name: acc.name,
      group: acc.group,
      amount: acc.amount,
      description: acc.description,
      include_in_totals: true,
      is_hidden: false,
      order: i,
    });
  }

  // 4. Seed Income Categories
  for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
    const cat = DEFAULT_INCOME_CATEGORIES[i];
    await collections.categories().create({
      user: userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      order: i,
    });
  }

  // 5. Seed Expense Categories and Subcategories
  for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
    const cat = DEFAULT_EXPENSE_CATEGORIES[i];
    const createdCat = await collections.categories().create({
      user: userId,
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      order: i,
    });

    if (cat.subcategories && cat.subcategories.length > 0) {
      for (let j = 0; j < cat.subcategories.length; j++) {
        await collections.subcategories().create({
          user: userId,
          category: createdCat.id,
          name: cat.subcategories[j],
          order: j,
        });
      }
    }
  }
}
