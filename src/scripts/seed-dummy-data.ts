import PocketBase from 'pocketbase';
import {
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_EXPENSE_CATEGORIES,
} from '../features/auth/seedData';
import type { AccountGroup, TransactionType, RecurrenceFrequency } from '../types';

const PB_URL = process.env.POCKETBASE_URL || 'http://130.210.55.88:8090';
const DEMO_EMAIL = process.env.DEMO_EMAIL || 'demo@moneymanager.app';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!';

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

interface DummyAccount {
  name: string;
  group: AccountGroup;
  amount: number;
  description?: string;
  settlement_date?: number;
  payment_date?: number;
  linked_account?: string;
}

const DUMMY_ACCOUNTS: DummyAccount[] = [
  { name: 'Cash', group: 'cash', amount: 25000, description: 'Physical cash and wallet' },
  { name: 'AXIS Salary Ac', group: 'accounts', amount: 185450, description: 'Primary salary checking account' },
  { name: 'SBI Savings', group: 'savings', amount: 450000, description: 'High-yield emergency fund' },
  { name: 'HSBC CC', group: 'card', amount: 34200, description: 'Travel credit card', settlement_date: 15, payment_date: 5 },
  { name: 'AXIS DC', group: 'debit_card', amount: 0, description: 'Debit card linked to Axis salary', linked_account: 'AXIS Salary Ac' },
  { name: 'Mutual Fund Portfolio', group: 'investments', amount: 820000, description: 'Equity mutual funds & ETFs' },
  { name: 'Car Loan', group: 'loan', amount: -350000, description: 'Auto vehicle finance loan liability' },
  { name: 'Mediclaim Policy', group: 'insurance', amount: 0, description: 'Family health mediclaim policy' },
];

export async function seedDummyData() {
  console.log(`Starting dummy data seed on PocketBase at ${PB_URL}...`);

  // 1. Authenticate or Create Demo User
  let userId = '';
  try {
    const authData = await pb.collection('users').authWithPassword(DEMO_EMAIL, DEMO_PASSWORD);
    userId = authData.record.id;
    console.log(`✓ Authenticated existing demo user: ${DEMO_EMAIL} (${userId})`);
  } catch {
    console.log(`Demo user not found. Registering ${DEMO_EMAIL}...`);
    const newUser = await pb.collection('users').create({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      passwordConfirm: DEMO_PASSWORD,
      name: 'Demo Trader',
    });
    userId = newUser.id;
    await pb.collection('users').authWithPassword(DEMO_EMAIL, DEMO_PASSWORD);
    console.log(`✓ Created and authenticated new demo user (${userId})`);
  }

  // 2. Clean up existing data for fresh seed
  console.log('Cleaning up existing demo user data...');
  const collectionsToClean = ['transactions', 'bookmarks', 'recurring_rules', 'subcategories', 'categories', 'accounts', 'user_preferences'];
  for (const col of collectionsToClean) {
    try {
      const records = await pb.collection(col).getFullList({ filter: `user = "${userId}"` });
      for (const rec of records) {
        await pb.collection(col).delete(rec.id);
      }
    } catch (err: any) {
      console.log(`Note on cleaning ${col}:`, err.message);
    }
  }

  // 3. Create Preferences
  console.log('Creating demo user preferences...');
  await pb.collection('user_preferences').create({
    user: userId,
    main_currency: 'INR',
    sub_currency: 'USD',
    sub_currency_rate: 83.5,
    color_scheme: 'set_a',
    start_screen: 'daily',
    monthly_start_date: 1,
    weekly_start_day: 'sunday',
    carry_over: false,
    enable_subcategories: true,
    passcode: '1234',
    is_passcode_enabled: false,
    is_biometrics_enabled: false,
    time_input_mode: 'manual',
    show_description: true,
    autocomplete: true,
    input_order: 'amount_first',
    note_button: false,
    daily_reminder_time: '21:00',
  });

  // 4. Create Accounts
  console.log('Creating demo accounts...');
  const createdAccounts: Record<string, string> = {};
  for (let i = 0; i < DUMMY_ACCOUNTS.length; i++) {
    const acc = DUMMY_ACCOUNTS[i];
    const rec = await pb.collection('accounts').create({
      user: userId,
      name: acc.name,
      group: acc.group,
      amount: acc.amount,
      description: acc.description || '',
      include_in_totals: true,
      is_hidden: false,
      order: i,
      settlement_date: acc.settlement_date || null,
      payment_date: acc.payment_date || null,
      linked_account: acc.linked_account || '',
    });
    createdAccounts[acc.name] = rec.id;
  }

  // 5. Create Income Categories
  console.log('Creating income categories...');
  const incomeCats: Record<string, string> = {};
  for (let i = 0; i < DEFAULT_INCOME_CATEGORIES.length; i++) {
    const cat = DEFAULT_INCOME_CATEGORIES[i];
    const rec = await pb.collection('categories').create({
      user: userId,
      name: cat.name,
      type: 'income',
      icon: cat.icon,
      order: i,
    });
    incomeCats[cat.name] = rec.id;
  }

  // 6. Create Expense Categories & Subcategories
  console.log('Creating expense categories and subcategories...');
  const expenseCats: Record<string, string> = {};
  const expenseSubcats: Record<string, Record<string, string>> = {};

  for (let i = 0; i < DEFAULT_EXPENSE_CATEGORIES.length; i++) {
    const cat = DEFAULT_EXPENSE_CATEGORIES[i];
    const rec = await pb.collection('categories').create({
      user: userId,
      name: cat.name,
      type: 'expense',
      icon: cat.icon,
      order: i,
    });
    expenseCats[cat.name] = rec.id;
    expenseSubcats[cat.name] = {};

    if (cat.subcategories) {
      for (let j = 0; j < cat.subcategories.length; j++) {
        const subName = cat.subcategories[j];
        const subRec = await pb.collection('subcategories').create({
          user: userId,
          category: rec.id,
          name: subName,
          order: j,
        });
        expenseSubcats[cat.name][subName] = subRec.id;
      }
    }
  }

  // 7. Seed Transactions across July, August, September 2026
  console.log('Seeding rich transactions...');

  const transactionsToCreate: {
    type: TransactionType;
    date: string;
    amount: number;
    fee?: number;
    category?: string;
    subcategory?: string;
    from_account?: string;
    to_account?: string;
    note?: string;
    description?: string;
  }[] = [
    // --- SEPTEMBER 2026 ---
    {
      type: 'income',
      date: '2026-09-01T09:30:00.000Z',
      amount: 150000,
      category: incomeCats['Salary'],
      to_account: createdAccounts['AXIS Salary Ac'],
      note: 'September Salary Credit',
      description: 'Monthly salary from Acme Corp',
    },
    {
      type: 'expense',
      date: '2026-09-01T13:15:00.000Z',
      amount: 450,
      category: expenseCats['Food'],
      subcategory: expenseSubcats['Food']?.['Lunch'],
      from_account: createdAccounts['Cash'],
      note: 'Office lunch thali',
      description: 'Lunch at Rasoi Ghar',
    },
    {
      type: 'expense',
      date: '2026-09-02T19:45:00.000Z',
      amount: 2850,
      category: expenseCats['Food'],
      subcategory: expenseSubcats['Food']?.['Dinner'],
      from_account: createdAccounts['HSBC CC'],
      note: 'Dinner at Maharaja Restaurant',
      description: 'Family dinner with friends',
    },
    {
      type: 'transfer',
      date: '2026-09-02T11:00:00.000Z',
      amount: 10000,
      fee: 0,
      from_account: createdAccounts['AXIS Salary Ac'],
      to_account: createdAccounts['Cash'],
      note: 'ATM cash withdrawal',
      description: 'Branch ATM withdrawal for pocket money',
    },

    // --- AUGUST 2026 ---
    {
      type: 'income',
      date: '2026-08-01T09:30:00.000Z',
      amount: 150000,
      category: incomeCats['Salary'],
      to_account: createdAccounts['AXIS Salary Ac'],
      note: 'August Salary',
      description: 'Monthly payroll',
    },
    {
      type: 'income',
      date: '2026-08-15T14:00:00.000Z',
      amount: 35000,
      category: incomeCats['Bonus'],
      to_account: createdAccounts['AXIS Salary Ac'],
      note: 'Consulting freelance project',
      description: 'UI/UX architecture client advisory',
    },
    {
      type: 'income',
      date: '2026-08-20T10:15:00.000Z',
      amount: 8500,
      category: incomeCats['Allowance'],
      to_account: createdAccounts['SBI Savings'],
      note: 'Mutual fund quarterly dividend',
      description: 'HDFC Top 100 dividend payout',
    },
    {
      type: 'expense',
      date: '2026-08-05T10:00:00.000Z',
      amount: 35000,
      category: expenseCats['Household'],
      subcategory: expenseSubcats['Household']?.['Rent'],
      from_account: createdAccounts['AXIS Salary Ac'],
      note: 'Apartment monthly rent',
      description: 'Direct transfer to landlord',
    },
    {
      type: 'expense',
      date: '2026-08-07T14:30:00.000Z',
      amount: 14500,
      category: expenseCats['EMI'],
      subcategory: expenseSubcats['EMI']?.['Car Loan'],
      from_account: createdAccounts['AXIS Salary Ac'],
      note: 'Car Loan EMI payment',
      description: 'Monthly auto loan installment',
    },
    {
      type: 'expense',
      date: '2026-08-08T18:20:00.000Z',
      amount: 4850,
      category: expenseCats['Household'],
      subcategory: expenseSubcats['Household']?.['Kitchen'],
      from_account: createdAccounts['HSBC CC'],
      note: 'Monthly groceries Nature Basket',
      description: 'Provisions, grains and household items',
    },
    {
      type: 'expense',
      date: '2026-08-10T12:00:00.000Z',
      amount: 2500,
      category: expenseCats['Health'],
      subcategory: expenseSubcats['Health']?.['Yoga'],
      from_account: createdAccounts['AXIS Salary Ac'],
      note: 'Gold Gym monthly membership',
      description: 'Fitness and yoga classes',
    },
    {
      type: 'expense',
      date: '2026-08-12T19:30:00.000Z',
      amount: 3200,
      category: expenseCats['Food'],
      subcategory: expenseSubcats['Food']?.['Eating out'],
      from_account: createdAccounts['HSBC CC'],
      note: 'Dinner with college alumni',
      description: 'Italian bistro pasta and wine',
    },
    {
      type: 'expense',
      date: '2026-08-14T11:45:00.000Z',
      amount: 350,
      category: expenseCats['Food'],
      subcategory: expenseSubcats['Food']?.['Beverages'],
      from_account: createdAccounts['Cash'],
      note: 'Starbucks cold brew',
      description: 'Coffee during client call',
    },
    {
      type: 'expense',
      date: '2026-08-18T16:10:00.000Z',
      amount: 1150,
      category: expenseCats['Transport'],
      subcategory: expenseSubcats['Transport']?.['Taxi'],
      from_account: createdAccounts['HSBC CC'],
      note: 'Uber taxi ride airport',
      description: 'Cab ride from terminal 2',
    },
    {
      type: 'expense',
      date: '2026-08-22T15:00:00.000Z',
      amount: 4500,
      category: expenseCats['Apparel'],
      subcategory: expenseSubcats['Apparel']?.['Clothing'],
      from_account: createdAccounts['HSBC CC'],
      note: 'Zara formal shirts',
      description: 'Work shirts and trousers',
    },
    {
      type: 'expense',
      date: '2026-08-25T17:30:00.000Z',
      amount: 950,
      category: expenseCats['Culture'],
      subcategory: expenseSubcats['Culture']?.['Movie'],
      from_account: createdAccounts['HSBC CC'],
      note: 'IMAX movie tickets',
      description: 'Weekend cinema with family',
    },
    {
      type: 'transfer',
      date: '2026-08-05T16:00:00.000Z',
      amount: 30000,
      fee: 0,
      from_account: createdAccounts['AXIS Salary Ac'],
      to_account: createdAccounts['SBI Savings'],
      note: 'Monthly savings auto-allocation',
      description: 'Transfer to emergency fund',
    },
    {
      type: 'transfer',
      date: '2026-08-28T12:00:00.000Z',
      amount: 28000,
      fee: 0,
      from_account: createdAccounts['AXIS Salary Ac'],
      to_account: createdAccounts['HSBC CC'],
      note: 'HSBC CC statement bill settlement',
      description: 'Cleared full statement balance',
    },
    {
      type: 'transfer',
      date: '2026-08-29T14:30:00.000Z',
      amount: 15000,
      fee: 25,
      from_account: createdAccounts['AXIS Salary Ac'],
      to_account: createdAccounts['SBI Savings'],
      note: 'Fixed deposit transfer',
      description: 'NEFT wire with fee',
    },

    // --- JULY 2026 ---
    {
      type: 'income',
      date: '2026-07-01T09:30:00.000Z',
      amount: 150000,
      category: incomeCats['Salary'],
      to_account: createdAccounts['AXIS Salary Ac'],
      note: 'July Salary',
    },
    {
      type: 'expense',
      date: '2026-07-05T10:00:00.000Z',
      amount: 35000,
      category: expenseCats['Household'],
      subcategory: expenseSubcats['Household']?.['Rent'],
      from_account: createdAccounts['AXIS Salary Ac'],
      note: 'July Apartment Rent',
    },
    {
      type: 'expense',
      date: '2026-07-10T20:00:00.000Z',
      amount: 5200,
      category: expenseCats['Apparel'],
      subcategory: expenseSubcats['Apparel']?.['Shoes'],
      from_account: createdAccounts['HSBC CC'],
      note: 'Nike running shoes',
    },
    {
      type: 'expense',
      date: '2026-07-16T13:30:00.000Z',
      amount: 600,
      category: expenseCats['Food'],
      subcategory: expenseSubcats['Food']?.['Lunch'],
      from_account: createdAccounts['Cash'],
      note: 'Business lunch buffet',
    },
    {
      type: 'expense',
      date: '2026-07-24T18:00:00.000Z',
      amount: 1500,
      category: expenseCats['Transport'],
      subcategory: expenseSubcats['Transport']?.['Subway'],
      from_account: createdAccounts['Cash'],
      note: 'Metro card monthly recharge',
    },
  ];

  for (const t of transactionsToCreate) {
    await pb.collection('transactions').create({
      user: userId,
      type: t.type,
      date: t.date,
      amount: t.amount,
      fee: t.fee || 0,
      category: t.category || null,
      subcategory: t.subcategory || null,
      from_account: t.from_account || null,
      to_account: t.to_account || null,
      note: t.note || '',
      description: t.description || '',
      is_recurring: false,
      is_bookmark: false,
    });
  }

  // 8. Create Bookmarks
  console.log('Creating bookmarks...');
  await pb.collection('bookmarks').create({
    user: userId,
    name: 'Morning Starbucks Coffee',
    type: 'expense',
    amount: 350,
    category: expenseCats['Food'],
    subcategory: expenseSubcats['Food']?.['Beverages'],
    from_account: createdAccounts['Cash'],
    note: 'Starbucks cold brew',
  });

  await pb.collection('bookmarks').create({
    user: userId,
    name: 'Metro Card Reload',
    type: 'expense',
    amount: 1000,
    category: expenseCats['Transport'],
    subcategory: expenseSubcats['Transport']?.['Subway'],
    from_account: createdAccounts['Cash'],
    note: 'Metro transit card',
  });

  // 9. Create Recurring Rules
  console.log('Creating recurring rules...');
  await pb.collection('recurring_rules').create({
    user: userId,
    type: 'income',
    frequency: 'every_month' as RecurrenceFrequency,
    timing: 'on_date',
    start_date: '2026-01-01',
    next_run_date: '2026-10-01',
    amount: 150000,
    category: incomeCats['Salary'],
    to_account: createdAccounts['AXIS Salary Ac'],
    note: 'Monthly salary credit',
    is_active: true,
  });

  await pb.collection('recurring_rules').create({
    user: userId,
    type: 'expense',
    frequency: 'every_month' as RecurrenceFrequency,
    timing: 'on_date',
    start_date: '2026-01-05',
    next_run_date: '2026-10-05',
    amount: 35000,
    category: expenseCats['Household'],
    subcategory: expenseSubcats['Household']?.['Rent'],
    from_account: createdAccounts['AXIS Salary Ac'],
    note: 'Apartment monthly rent',
    is_active: true,
  });

  console.log('🎉 Dummy data seed finished successfully!');
  console.log(`Demo Credentials:`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedDummyData().catch((err) => {
    console.error('❌ Dummy seed error:', JSON.stringify(err.data || err.response || err, null, 2));
    process.exit(1);
  });
}
