import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.moneymanager.expensetracker',
  appName: 'Money Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
