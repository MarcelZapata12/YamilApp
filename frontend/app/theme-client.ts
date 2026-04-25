export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme-mode';
export const THEME_CHANGED_EVENT = 'theme-changed';

const DEFAULT_THEME_MODE: ThemeMode = 'light';

let themeModeCache: ThemeMode = DEFAULT_THEME_MODE;

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark';
}

function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.dataset.theme = mode;
}

export function getStoredThemeMode() {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME_MODE;
  }

  const storedValue = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemeMode(storedValue) ? storedValue : DEFAULT_THEME_MODE;
}

export function getThemeMode() {
  const mode = getStoredThemeMode();

  if (themeModeCache === mode) {
    return themeModeCache;
  }

  themeModeCache = mode;
  applyThemeMode(themeModeCache);
  return themeModeCache;
}

export function getServerThemeMode() {
  return DEFAULT_THEME_MODE;
}

export function subscribeToTheme(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const syncTheme = () => callback();

  window.addEventListener('focus', syncTheme);
  window.addEventListener('storage', syncTheme);
  window.addEventListener(THEME_CHANGED_EVENT, syncTheme);

  return () => {
    window.removeEventListener('focus', syncTheme);
    window.removeEventListener('storage', syncTheme);
    window.removeEventListener(THEME_CHANGED_EVENT, syncTheme);
  };
}

export function notifyThemeChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
}

export function setThemeMode(mode: ThemeMode) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  themeModeCache = mode;
  applyThemeMode(mode);
  notifyThemeChanged();
}

export function toggleThemeMode() {
  setThemeMode(getThemeMode() === 'dark' ? 'light' : 'dark');
}

export function initializeThemeMode() {
  const mode = getThemeMode();
  applyThemeMode(mode);
  return mode;
}
