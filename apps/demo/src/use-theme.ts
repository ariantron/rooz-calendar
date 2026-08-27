import { useCallback, useSyncExternalStore } from 'react';

/** `system` follows the OS preference; the other two pin it. */
export type Theme = 'system' | 'light' | 'dark';
/** What `system` actually resolved to right now. */
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'rooz-calendar-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/**
 * A single source of truth for the theme, shared by the playground's own
 * control and the docs site's header button — two controls over one `.dark`
 * class would otherwise drift apart the moment either one is used.
 *
 * The library's tokens are class-driven (`:root` light, `.dark` dark), so
 * applying a theme means nothing more than toggling that class on `<html>`.
 */
const listeners = new Set<() => void>();
let theme: Theme = readStoredTheme();

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Private mode, or storage disabled — fall through to the OS preference.
  }
  return 'system';
}

function prefersDark(): boolean {
  return window.matchMedia?.(DARK_QUERY).matches ?? false;
}

/** Resolve `system` against the OS preference. */
export function resolveTheme(value: Theme): ResolvedTheme {
  if (value === 'system') return prefersDark() ? 'dark' : 'light';
  return value;
}

function applyTheme(): void {
  document.documentElement.classList.toggle('dark', resolveTheme(theme) === 'dark');
}

function emit(): void {
  for (const listener of listeners) listener();
}

export function setTheme(next: Theme): void {
  if (next === theme) return;
  theme = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Not being able to remember the choice is not a reason to ignore it.
  }
  applyTheme();
  emit();
}

// Track the OS preference so `system` stays live rather than sampled once.
window.matchMedia?.(DARK_QUERY).addEventListener('change', () => {
  if (theme !== 'system') return;
  applyTheme();
  emit();
});

applyTheme();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): Theme {
  return theme;
}

/** Read and set the theme. Every caller shares one store. */
export function useTheme(): {
  theme: Theme;
  resolved: ResolvedTheme;
  setTheme: (next: Theme) => void;
} {
  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    theme: value,
    resolved: resolveTheme(value),
    setTheme: useCallback(setTheme, []),
  };
}
