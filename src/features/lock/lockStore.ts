import { create } from 'zustand';

interface LockState {
  isLocked: boolean;
  pin: string;
  error: string | null;
  attempts: number;

  setLocked: (locked: boolean) => void;
  appendDigit: (digit: string, expectedPin: string) => boolean;
  removeDigit: () => void;
  clearPin: () => void;
  unlock: () => void;
}

export const useLockStore = create<LockState>((set, get) => ({
  isLocked: false,
  pin: '',
  error: null,
  attempts: 0,

  setLocked: (locked: boolean) => {
    set({ isLocked: locked, pin: '', error: null });
  },

  appendDigit: (digit: string, expectedPin: string) => {
    const current = get().pin;
    if (current.length >= 4) return false;

    const next = current + digit;
    set({ pin: next, error: null });

    if (next.length === 4) {
      if (next === expectedPin) {
        set({ isLocked: false, pin: '', error: null, attempts: 0 });
        return true;
      } else {
        set((state) => ({
          pin: '',
          error: 'Incorrect Passcode. Try again.',
          attempts: state.attempts + 1,
        }));
        return false;
      }
    }
    return false;
  },

  removeDigit: () => {
    set((state) => ({
      pin: state.pin.slice(0, -1),
      error: null,
    }));
  },

  clearPin: () => {
    set({ pin: '', error: null });
  },

  unlock: () => {
    set({ isLocked: false, pin: '', error: null });
  },
}));
