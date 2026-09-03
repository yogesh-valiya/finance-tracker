import { create } from 'zustand';

interface LockState {
  isLocked: boolean;
  pin: string;
  error: string | null;
  attempts: number;

  savedPin: string;
  isPasscodeSet: boolean;
  isBiometricsEnabled: boolean;

  setLocked: (locked: boolean) => void;
  appendDigit: (digit: string, expectedPin: string) => boolean;
  removeDigit: () => void;
  clearPin: () => void;
  unlock: () => void;

  setPasscode: (pin: string) => void;
  disablePasscode: () => void;
  setBiometrics: (enabled: boolean) => void;
}

const PIN_STORAGE_KEY = 'money_manager_saved_pin';
const BIOMETRICS_STORAGE_KEY = 'money_manager_biometrics_enabled';

export const useLockStore = create<LockState>((set, get) => {
  const savedPin = localStorage.getItem(PIN_STORAGE_KEY) || '';
  const isBiometricsEnabled = localStorage.getItem(BIOMETRICS_STORAGE_KEY) === 'true';

  return {
    isLocked: false,
    pin: '',
    error: null,
    attempts: 0,

    savedPin,
    isPasscodeSet: !!savedPin,
    isBiometricsEnabled,

    setLocked: (locked: boolean) => {
      set({ isLocked: locked, pin: '', error: null });
    },

    appendDigit: (digit: string, expectedPin: string) => {
      const current = get().pin;
      if (current.length >= 4) return false;

      const next = current + digit;
      set({ pin: next, error: null });

      if (next.length === 4) {
        const pinToTest = expectedPin || get().savedPin;
        if (next === pinToTest) {
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

    setPasscode: (pin: string) => {
      localStorage.setItem(PIN_STORAGE_KEY, pin);
      set({ savedPin: pin, isPasscodeSet: true });
    },

    disablePasscode: () => {
      localStorage.removeItem(PIN_STORAGE_KEY);
      set({ savedPin: '', isPasscodeSet: false });
    },

    setBiometrics: (enabled: boolean) => {
      localStorage.setItem(BIOMETRICS_STORAGE_KEY, enabled.toString());
      set({ isBiometricsEnabled: enabled });
    },
  };
});
