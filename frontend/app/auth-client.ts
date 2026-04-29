export type UserRole = 'admin' | 'usuario';

export type AuthPayload = {
  id?: string;
  role?: UserRole;
  exp?: number;
  iat?: number;
};

export type AuthState = {
  token: string | null;
  isLogged: boolean;
  isAdmin: boolean;
  role: UserRole | null;
  email: string | null;
};

export const AUTH_CHANGED_EVENT = 'auth-changed';
const AUTH_EMAIL_KEY = 'auth-email';

const EMPTY_AUTH_STATE: AuthState = {
  token: null,
  isLogged: false,
  isAdmin: false,
  role: null,
  email: null,
};

let authStateCache: AuthState = EMPTY_AUTH_STATE;
let authTokenCache: string | null = null;
let authEmailCache: string | null = null;

function isExpiredPayload(payload: AuthPayload | null) {
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4;
  const padded =
    padding === 0 ? normalized : `${normalized}${'='.repeat(4 - padding)}`;

  return window.atob(padded);
}

export function readTokenPayload(token: string | null): AuthPayload | null {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as AuthPayload;
  } catch {
    return null;
  }
}

export function getStoredToken() {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = window.localStorage.getItem('token');
  const payload = readTokenPayload(token);

  if (token && (!payload || isExpiredPayload(payload))) {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem(AUTH_EMAIL_KEY);
    return null;
  }

  return token;
}

export function getStoredUserEmail() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(AUTH_EMAIL_KEY);
}

export function getAuthState() {
  const token = getStoredToken();
  const email = getStoredUserEmail();

  if (token === authTokenCache && email === authEmailCache) {
    return authStateCache;
  }

  const payload = readTokenPayload(token);

  authTokenCache = token;
  authEmailCache = email;
  authStateCache = {
    token,
    isLogged: Boolean(payload),
    isAdmin: payload?.role === 'admin',
    role: payload?.role ?? null,
    email,
  };

  return authStateCache;
}

export function getServerAuthState() {
  return EMPTY_AUTH_STATE;
}

export function subscribeToAuth(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const syncAuthState = () => callback();

  window.addEventListener('focus', syncAuthState);
  window.addEventListener('storage', syncAuthState);
  window.addEventListener(AUTH_CHANGED_EVENT, syncAuthState);

  return () => {
    window.removeEventListener('focus', syncAuthState);
    window.removeEventListener('storage', syncAuthState);
    window.removeEventListener(AUTH_CHANGED_EVENT, syncAuthState);
  };
}

export function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
}

export function persistAuthSession({
  token,
  email,
}: {
  token: string;
  email?: string | null;
}) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem('token', token);

  if (email) {
    window.localStorage.setItem(AUTH_EMAIL_KEY, email);
  } else {
    window.localStorage.removeItem(AUTH_EMAIL_KEY);
  }

  notifyAuthChanged();
}

export function setStoredUserEmail(email: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_EMAIL_KEY, email);
  notifyAuthChanged();
}

export function clearAuthSession() {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem('token');
  window.localStorage.removeItem(AUTH_EMAIL_KEY);
  notifyAuthChanged();
}

export async function validateAuthSession(token: string) {
  const response = await fetch(
    `${
      (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000').replace(
        /\/$/,
        ''
      )
    }/api/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    }
  ).catch(() => null);

  if (!response) {
    return true;
  }

  if (response.status === 401) {
    clearAuthSession();
    return false;
  }

  return response.ok;
}

export function getUserDisplayName(email: string | null) {
  if (!email) {
    return 'Mi cuenta';
  }

  const [rawName] = email.split('@');
  const parts = rawName
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1));

  return parts.join(' ') || email;
}

export function getUserInitials(email: string | null) {
  const displayName = getUserDisplayName(email);
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return initials || 'U';
}
