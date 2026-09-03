---
trigger: model_decision
description: Capacitor mobile rules — safe area insets, Android hardware back button, biometrics lifecycle, native fallbacks
---

# Capacitor Native & Mobile UX

- **Safe Areas**: All root view layouts, bottom navigation bars, top period bars, and the `+` FAB must respect CSS safe-area env variables (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
- **Hardware Back Button (Android)**: Open drawers, modals, action sheets, and custom numpads must capture `App.addListener('backButton')` to dismiss before allowing page back-navigation or app exit.
- **Background / Resume App Lock**: When Passcode/Biometrics is enabled, listen to `AppState.addListener('appStateChange')` to display the PIN/Biometric lock screen upon returning to foreground.
- **Web Fallbacks**: Wrap all Capacitor plugins (`@capacitor/preferences`, `@capacitor-community/device-unlock`, `@capacitor/filesystem`) with browser fallbacks so the app runs fully on web.
