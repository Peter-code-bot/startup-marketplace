"use client";

import { useEffect } from "react";

export function CapacitorInit() {
  useEffect(() => {
    const init = async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return;

      // Back button handling for Android
      const { App } = await import("@capacitor/app");
      App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) {
          window.history.back();
        } else {
          App.exitApp();
        }
      });

      // Hide splash screen after web loads
      const { SplashScreen } = await import("@capacitor/splash-screen");
      setTimeout(() => SplashScreen.hide(), 500);

      // Configure status bar
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: "#0D0D1A" });
    };

    init().catch(() => {});
  }, []);

  return null;
}
