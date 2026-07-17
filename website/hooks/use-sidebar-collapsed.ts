"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "dandev:sidebar-collapsed";

/* localStorage is an external store, so read it through useSyncExternalStore
   rather than syncing it into state inside an effect: no cascading render, and
   `getServerSnapshot` keeps SSR and hydration agreeing (expanded by default).
   The listener set also keeps multiple sidebars — and other tabs — in step. */
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

const subscribe = (onChange: () => void) => {
  listeners.add(onChange);
  // `storage` only fires in *other* tabs; `emit()` covers this one.
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
};

const getSnapshot = () => localStorage.getItem(STORAGE_KEY) === "1";
const getServerSnapshot = () => false;

export const toggleSidebarCollapsed = () => {
  localStorage.setItem(STORAGE_KEY, getSnapshot() ? "0" : "1");
  emit();
};

export const useSidebarCollapsed = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
