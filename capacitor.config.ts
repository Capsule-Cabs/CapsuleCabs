import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.capsulecabs.app',
  appName: 'CapsuleCabs',
  webDir: 'dist',
  android: {
    backgroundColor: '#000000',
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#000000',
      splashFullScreen: true,
      splashImmersive: false  // ← Respect status bar
    },
    StatusBar: {
      style: 'dark',
      overlapsWebView: true,
      backgroundColor: '#000000'
    }
  }
};

export default config;
