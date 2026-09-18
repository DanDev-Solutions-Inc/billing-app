"use client";

import { useSyncExternalStore } from "react";
import { Theme } from "@typings/Theme";
import { THEME_STORAGE_KEY } from "@utils/theme";

/* The theme lives on <html data-theme>, set before first paint by the inline
   script in app/layout.tsx, so there's no flash of the wrong palette. This
   hook reads that attribute rather than localStorage: it's what's actually on
   screen. Same useSyncExternalStore shape as use-sidebar-collapsed. */
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  // Another tab switched themes: follow it here too.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_STORAGE_KEY) return;
    applyTheme(e.newValue === "light" ? "light" : "dark");
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
};

const getSnapshot = (): Theme =>
  document.documentElement.dataset.theme === "light" ? "light" : "dark";
// Dark is the default the server renders.
const getServerSnapshot = (): Theme => "dark";

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  emit();
};

export const setTheme = (theme: Theme) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode / blocked storage: still switch, just don't remember it.
  }
  applyTheme(theme);
};

export const toggleTheme = () =>
  setTheme(getSnapshot() === "dark" ? "light" : "dark");

export const useTheme = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
