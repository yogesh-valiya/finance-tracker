import PocketBase from 'pocketbase';
import type {
  Account,
  Category,
  Subcategory,
  Transaction,
  UserPreference,
  Bookmark,
  RecurringRule,
} from '@/types';

// Central PocketBase server endpoint URL
export const POCKETBASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_POCKETBASE_URL) ||
  (typeof process !== 'undefined' && process.env?.POCKETBASE_URL) ||
  'http://130.210.55.88:8090';

// Central singleton PocketBase instance
export const pb = new PocketBase(POCKETBASE_URL);

// Disable auto-cancellation globally for reliable concurrent requests
pb.autoCancellation(false);

// Strongly typed collection accessors
export const collections = {
  users: () => pb.collection('users'),
  accounts: () => pb.collection<Account>('accounts'),
  categories: () => pb.collection<Category>('categories'),
  subcategories: () => pb.collection<Subcategory>('subcategories'),
  transactions: () => pb.collection<Transaction>('transactions'),
  userPreferences: () => pb.collection<UserPreference>('user_preferences'),
  bookmarks: () => pb.collection<Bookmark>('bookmarks'),
  recurringRules: () => pb.collection<RecurringRule>('recurring_rules'),
};

/**
 * Returns the currently authenticated user's ID or null
 */
export function getCurrentUserId(): string | null {
  return pb.authStore.model?.id || null;
}

/**
 * Checks if the current session is valid and authenticated
 */
export function isAuthenticated(): boolean {
  return pb.authStore.isValid && !!pb.authStore.model?.id;
}
