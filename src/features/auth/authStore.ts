import { create } from 'zustand';
import { pb, collections } from '@/lib/pocketbase';
import { seedUserMasterData } from './seedData';
import type { User, UserPreference } from '@/types';

interface AuthState {
  user: User | null;
  preferences: UserPreference | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  quickDemoLogin: () => Promise<void>;
  register: (params: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    mainCurrency?: string;
  }) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  fetchPreferences: () => Promise<UserPreference | null>;
  updatePreferences: (partial: Partial<UserPreference>) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  preferences: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  clearError: () => set({ error: null }),

  initAuth: async () => {
    set({ isLoading: true });
    try {
      if (pb.authStore.isValid && pb.authStore.model) {
        const rawUser = pb.authStore.model;
        const user: User = {
          id: rawUser.id,
          email: rawUser.email || '',
          name: rawUser.name || rawUser.email?.split('@')[0] || 'User',
          avatar: rawUser.avatar,
          created: rawUser.created,
          updated: rawUser.updated,
        };

        set({ user, isAuthenticated: true });
        await get().fetchPreferences();
      } else {
        set({ user: null, preferences: null, isAuthenticated: false });
      }
    } catch (err: any) {
      console.error('Init auth error:', err);
      set({ user: null, preferences: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }

    // Subscribe to authStore changes
    pb.authStore.onChange((token, model) => {
      if (model && pb.authStore.isValid) {
        const user: User = {
          id: model.id,
          email: model.email || '',
          name: model.name || model.email?.split('@')[0] || 'User',
          avatar: model.avatar,
          created: model.created,
          updated: model.updated,
        };
        set({ user, isAuthenticated: true });
      } else {
        set({ user: null, preferences: null, isAuthenticated: false });
      }
    });
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const authData = await pb.collection('users').authWithPassword(email.trim(), password);
      const rawUser = authData.record;
      const user: User = {
        id: rawUser.id,
        email: rawUser.email || '',
        name: rawUser.name || rawUser.email?.split('@')[0] || 'User',
        avatar: rawUser.avatar,
        created: rawUser.created,
        updated: rawUser.updated,
      };

      set({ user, isAuthenticated: true, error: null });
      await get().fetchPreferences();
    } catch (err: any) {
      const message =
        err?.data?.message || err?.message || 'Invalid email or password. Please try again.';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  quickDemoLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const demoEmail = 'demo@moneymanager.app';
      const demoPassword = 'Password123!';
      try {
        await pb.collection('users').authWithPassword(demoEmail, demoPassword);
      } catch {
        // Create demo user if not found
        await pb.collection('users').create({
          email: demoEmail,
          password: demoPassword,
          passwordConfirm: demoPassword,
          name: 'Demo Trader',
        });
        await pb.collection('users').authWithPassword(demoEmail, demoPassword);
        await seedUserMasterData(pb.authStore.model!.id, 'INR');
      }

      const rawUser = pb.authStore.model!;
      const user: User = {
        id: rawUser.id,
        email: rawUser.email || '',
        name: rawUser.name || 'Demo Trader',
        created: rawUser.created,
        updated: rawUser.updated,
      };

      set({ user, isAuthenticated: true, error: null });
      await get().fetchPreferences();
    } catch (err: any) {
      const message = err?.message || 'Failed to start demo session.';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async ({ name, email, password, passwordConfirm, mainCurrency = 'INR' }) => {
    set({ isLoading: true, error: null });
    try {
      const newUser = await pb.collection('users').create({
        email: email.trim(),
        password,
        passwordConfirm,
        name: name.trim(),
      });

      // Authenticate
      await pb.collection('users').authWithPassword(email.trim(), password);

      // Seed initial accounts, categories, preferences
      await seedUserMasterData(newUser.id, mainCurrency);

      const user: User = {
        id: newUser.id,
        email: newUser.email || '',
        name: newUser.name || name,
        created: newUser.created,
        updated: newUser.updated,
      };

      set({ user, isAuthenticated: true, error: null });
      await get().fetchPreferences();
    } catch (err: any) {
      const message =
        err?.data?.data?.email?.message ||
        err?.data?.message ||
        err?.message ||
        'Registration failed. Please check your inputs.';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    pb.authStore.clear();
    set({ user: null, preferences: null, isAuthenticated: false, error: null });
  },

  requestPasswordReset: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      await pb.collection('users').requestPasswordReset(email.trim());
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Failed to request password reset.';
      set({ error: message });
      throw new Error(message);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchPreferences: async () => {
    const userId = pb.authStore.model?.id;
    if (!userId) return null;

    try {
      const pref = await collections.userPreferences().getFirstListItem(`user = "${userId}"`);
      set({ preferences: pref as UserPreference });

      // Apply color scheme to document element
      if (pref.color_scheme === 'set_b') {
        document.documentElement.classList.add('color-scheme-b');
      } else {
        document.documentElement.classList.remove('color-scheme-b');
      }

      return pref as UserPreference;
    } catch {
      // If preferences don't exist yet, seed them
      await seedUserMasterData(userId, 'INR');
      try {
        const pref = await collections.userPreferences().getFirstListItem(`user = "${userId}"`);
        set({ preferences: pref as UserPreference });
        return pref as UserPreference;
      } catch {
        return null;
      }
    }
  },

  updatePreferences: async (partial: Partial<UserPreference>) => {
    const userId = pb.authStore.model?.id;
    const existing = get().preferences;
    if (!userId) return;

    try {
      if (existing?.id) {
        const updated = await collections.userPreferences().update(existing.id, partial);
        set({ preferences: updated as UserPreference });
      } else {
        const created = await collections.userPreferences().create({
          user: userId,
          ...partial,
        });
        set({ preferences: created as UserPreference });
      }

      if (partial.color_scheme) {
        if (partial.color_scheme === 'set_b') {
          document.documentElement.classList.add('color-scheme-b');
        } else {
          document.documentElement.classList.remove('color-scheme-b');
        }
      }
    } catch (err: any) {
      console.error('Failed to update preferences:', err);
      throw err;
    }
  },
}));
