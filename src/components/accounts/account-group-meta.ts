import { AccountGroup } from "@prisma/client";
import {
  Banknote,
  Building2,
  PiggyBank,
  CreditCard,
  Smartphone,
  TrendingUp,
  AlertCircle,
  HandCoins,
  Shield,
  CircleDot,
  LucideIcon,
} from "lucide-react";

export interface GroupMeta {
  group: AccountGroup;
  label: string;
  description: string;
  icon: LucideIcon;
  isLiability: boolean;
}

export const ACCOUNT_GROUPS_META: Record<AccountGroup, GroupMeta> = {
  CASH: {
    group: "CASH",
    label: "Cash",
    description: "Physical cash and paper currency",
    icon: Banknote,
    isLiability: false,
  },
  BANK_ACCOUNT: {
    group: "BANK_ACCOUNT",
    label: "Bank Accounts",
    description: "Checking and everyday bank accounts",
    icon: Building2,
    isLiability: false,
  },
  SAVINGS: {
    group: "SAVINGS",
    label: "Savings",
    description: "High-yield savings and fixed deposits",
    icon: PiggyBank,
    isLiability: false,
  },
  CREDIT_CARD: {
    group: "CREDIT_CARD",
    label: "Credit Cards",
    description: "Revolving credit cards with billing cycles",
    icon: CreditCard,
    isLiability: true,
  },
  DEBIT_CARD: {
    group: "DEBIT_CARD",
    label: "Debit Cards",
    description: "Debit cards linked to bank accounts",
    icon: CreditCard,
    isLiability: false,
  },
  PREPAID: {
    group: "PREPAID",
    label: "Top-Up / Prepaid",
    description: "Digital wallets, transit, and gift cards",
    icon: Smartphone,
    isLiability: false,
  },
  INVESTMENT: {
    group: "INVESTMENT",
    label: "Investments",
    description: "Stocks, mutual funds, crypto, retirement",
    icon: TrendingUp,
    isLiability: false,
  },
  OVERDRAFT: {
    group: "OVERDRAFT",
    label: "Overdrafts",
    description: "Credit lines and account overdraft facilities",
    icon: AlertCircle,
    isLiability: true,
  },
  LOAN: {
    group: "LOAN",
    label: "Loans",
    description: "Mortgages, personal loans, and auto debt",
    icon: HandCoins,
    isLiability: true,
  },
  INSURANCE: {
    group: "INSURANCE",
    label: "Insurance",
    description: "Life, health, vehicle, and asset policies",
    icon: Shield,
    isLiability: false,
  },
  OTHER: {
    group: "OTHER",
    label: "Others",
    description: "Miscellaneous accounts and funds",
    icon: CircleDot,
    isLiability: false,
  },
};
