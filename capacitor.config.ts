import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fincalc.app',
  appName: 'FinCalc',
  webDir: 'dist',
  android: {
    minWebViewVersion: 80,
  },
  plugins: {
    Preferences: {
      group: 'fincalc',
    },
  },
};

export default config;
