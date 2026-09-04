import { AccountGroup } from "@prisma/client";

export interface SeedAccount {
  name: string;
  group: AccountGroup;
  initialBalance: number;
}

export interface SeedCategory {
  name: string;
  emoji: string;
  subcategories: string[];
}

export const DEFAULT_ACCOUNTS: SeedAccount[] = [
  { name: "Cash Wallet", group: "CASH", initialBalance: 0 },
  { name: "Primary Checking", group: "BANK_ACCOUNT", initialBalance: 0 },
  { name: "High-Yield Savings", group: "SAVINGS", initialBalance: 0 },
];

export const DEFAULT_INCOME_CATEGORIES: SeedCategory[] = [
  {
    name: "Salary / Wages",
    emoji: "💰",
    subcategories: ["Base Salary", "Overtime", "Bonus & Commission"],
  },
  {
    name: "Business & Freelance",
    emoji: "💼",
    subcategories: ["Client Invoices", "Consulting", "Sales & Side Gigs"],
  },
  {
    name: "Investments",
    emoji: "📈",
    subcategories: ["Dividends", "Interest", "Capital Gains", "Rental Income"],
  },
  {
    name: "Gifts & Grants",
    emoji: "🎁",
    subcategories: ["Gifts Received", "Cashback & Rewards", "Tax Refunds / Reimbursements"],
  },
  {
    name: "Other Income",
    emoji: "💵",
    subcategories: [],
  },
];

export const DEFAULT_EXPENSE_CATEGORIES: SeedCategory[] = [
  {
    name: "Food & Dining",
    emoji: "🍔",
    subcategories: ["Groceries", "Restaurants", "Coffee & Cafes", "Food Delivery"],
  },
  {
    name: "Housing & Utilities",
    emoji: "🏠",
    subcategories: [
      "Rent",
      "Mortgage",
      "Electricity",
      "Water & Gas",
      "Internet & Mobile",
      "Home Maintenance",
    ],
  },
  {
    name: "Transportation",
    emoji: "🚗",
    subcategories: [
      "Fuel & Gas",
      "Public Transit",
      "Rideshare & Cabs",
      "Vehicle Maintenance",
      "Parking & Tolls",
    ],
  },
  {
    name: "Shopping & Lifestyle",
    emoji: "🛍️",
    subcategories: [
      "Clothing & Apparel",
      "Electronics & Gadgets",
      "Personal Care & Grooming",
      "Home Goods",
    ],
  },
  {
    name: "Health & Medical",
    emoji: "🏥",
    subcategories: [
      "Doctor & Dental",
      "Pharmacy & Medicine",
      "Health Insurance",
      "Fitness & Gym",
    ],
  },
  {
    name: "Entertainment & Leisure",
    emoji: "🎬",
    subcategories: [
      "Streaming & Subscriptions",
      "Movies & Events",
      "Gaming",
      "Hobbies",
      "Travel & Vacations",
    ],
  },
  {
    name: "Education & Learning",
    emoji: "📚",
    subcategories: ["Tuition & Courses", "Books & Learning Material", "Certifications"],
  },
  {
    name: "Bills & Financial Fees",
    emoji: "💳",
    subcategories: ["Bank & ATM Fees", "Loan Interest / EMI", "Credit Card Charges", "Taxes"],
  },
  {
    name: "Pets",
    emoji: "🐾",
    subcategories: ["Pet Food", "Vet & Healthcare", "Pet Supplies"],
  },
  {
    name: "Family & Gifts",
    emoji: "🎁",
    subcategories: ["Childcare & Family Support", "Gifts Given", "Donations & Charity"],
  },
  {
    name: "Miscellaneous",
    emoji: "📦",
    subcategories: ["General Expense", "Uncategorized"],
  },
];
