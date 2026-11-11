/**
 * Saved words and recent searches, kept in localStorage and shared by every component that
 * uses them. Works with storage blocked (values then last for the session only) and stays in
 * step across browser tabs.
 */
import { useSyncExternalStore } from 'react';
import { isStringArray, readJson, STORAGE_KEYS, writeJson } from './storage.ts';

const isNumberArray = (v: unknown): v is number[] => Array.isArray(v) && v.every((n) => Number.isInteger(n));

function createListStore<T>(key: string, isValid: (v: unknown) => v is T[]) {
  let value: T[] = typeof window === 'undefined' ? [] : readJson<T[]>(key, [], isValid);
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key !== key) return;
      value = readJson<T[]>(key, [], isValid);
      emit();
    });
  }
  return {
    get: () => value,
    set(next: T[]) {
      value = next;
      writeJson(key, next);
      emit();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const savedStore = createListStore<number>(STORAGE_KEYS.saved, isNumberArray);
const recentStore = createListStore<string>(STORAGE_KEYS.recent, isStringArray);

export const MAX_RECENT = 6;
/** What the prerendered HTML was built with: nothing saved, no recents. Same array every time. */
const NONE: never[] = [];
const serverSnapshot = () => NONE;

export function useSaved() {
  const ids = useSyncExternalStore(savedStore.subscribe, savedStore.get, serverSnapshot);
  return {
    ids,
    isSaved: (id: number) => ids.includes(id),
    /** Newest first, so the Saved list shows the latest word at the top. */
    toggle: (id: number) => savedStore.set(ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids]),
    remove: (id: number) => savedStore.set(ids.filter((x) => x !== id)),
  };
}

export function useRecent() {
  const items = useSyncExternalStore(recentStore.subscribe, recentStore.get, serverSnapshot);
  return {
    items,
    add(query: string) {
      const q = query.trim();
      if (!q) return;
      const rest = items.filter((item) => item.toLowerCase() !== q.toLowerCase());
      recentStore.set([q, ...rest].slice(0, MAX_RECENT));
    },
    clear: () => recentStore.set([]),
  };
}
