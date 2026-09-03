import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function initCapacitorBridge(callbacks?: {
  onBackButton?: () => boolean; // return true if handled, false to pop/exit
  onResume?: () => void;
}) {
  if (!isNativePlatform()) return;

  // 1. Android Hardware Back Button Handler
  try {
    CapApp.addListener('backButton', ({ canGoBack }) => {
      if (callbacks?.onBackButton) {
        const handled = callbacks.onBackButton();
        if (handled) return;
      }

      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });
  } catch (err) {
    console.warn('Capacitor backButton listener not available:', err);
  }

  // 2. AppState Resume Lifecycle (for passcode lock screen trigger)
  try {
    CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive && callbacks?.onResume) {
        callbacks.onResume();
      }
    });
  } catch (err) {
    console.warn('Capacitor appStateChange listener not available:', err);
  }
}
