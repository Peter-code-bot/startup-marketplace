import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'mx.vicino.app',
  appName: 'VICINO',
  webDir: 'dist',
  server: {
    url: 'https://startup-marketplace-web.vercel.app',
    cleartext: true,
    allowNavigation: [
      'startup-marketplace-web.vercel.app',
      '*.supabase.co',
      'accounts.google.com',
      '*.google.com',
    ],
  },
  android: {
    backgroundColor: '#0D0D1A',
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      launchShowDuration: 3000,
      backgroundColor: '#0D0D1A',
      showSpinner: true,
      spinnerColor: '#EDE0D4',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0D0D1A',
      overlaysWebView: false,
    },
  },
};

export default config;
