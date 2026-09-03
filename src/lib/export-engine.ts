import type { Transaction, Account, Category, Subcategory } from '@/types';

export interface BackupData {
  version: number;
  timestamp: string;
  accounts: Account[];
  categories: Category[];
  subcategories: Subcategory[];
  transactions: Transaction[];
  preferences: Record<string, any>;
}

export function generateBackupJSON(data: Omit<BackupData, 'version' | 'timestamp'>): string {
  const payload: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    ...data,
  };
  return JSON.stringify(payload, null, 2);
}

export function parseBackupJSON(jsonStr: string): BackupData {
  try {
    const parsed = JSON.parse(jsonStr);
    if (!parsed.version || !Array.isArray(parsed.accounts) || !Array.isArray(parsed.transactions)) {
      throw new Error('Invalid backup file format');
    }
    return parsed as BackupData;
  } catch (err: any) {
    throw new Error(`Failed to parse backup: ${err.message}`);
  }
}

export function exportTransactionsCSV(transactions: Transaction[]): void {
  const headers = [
    'Date',
    'Type',
    'Category',
    'Subcategory',
    'Amount',
    'Fee',
    'From Account',
    'To Account',
    'Note',
    'Description',
  ];

  const rows = transactions.map((t) => [
    new Date(t.date).toISOString().split('T')[0],
    t.type,
    t.expand?.category?.name || '',
    t.expand?.subcategory?.name || '',
    t.amount,
    t.fee || 0,
    t.expand?.from_account?.name || '',
    t.expand?.to_account?.name || '',
    `"${(t.note || '').replace(/"/g, '""')}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `money_manager_ledger_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
