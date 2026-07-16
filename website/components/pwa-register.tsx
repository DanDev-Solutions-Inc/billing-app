"use client";

import { useEffect } from "react";

// Registers the service worker so the app is installable on mobile/desktop.
export const PwaRegister = () => {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
};
