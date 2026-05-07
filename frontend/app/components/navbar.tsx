'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { apiUrl } from '../api-client';
import {
  clearAuthSession,
  getAuthState,
  getServerAuthState,
  getStoredToken,
  getUserDisplayName,
  getUserInitials,
  setStoredUserEmail,
  subscribeToAuth,
} from '../auth-client';
import {
  getServerThemeMode,
  getThemeMode,
  initializeThemeMode,
  subscribeToTheme,
  toggleThemeMode,
} from '../theme-client';

type CurrentUserResponse = {
  email?: string | null;
};

const NAV_LINKS = [
  { href: '/inicio', label: 'Inicio' },
  { href: '/documentos', label: 'Documentos' },
  { href: '/libros', label: 'Libros' },
  { href: '/about', label: 'Acerca' },
  { href: '/noticias', label: 'Noticias' },
  { href: '/calendario', label: 'Calendario' },
];

export default function Navbar() {
  const authState = useSyncExternalStore(
    subscribeToAuth,
    getAuthState,
    getServerAuthState
  );
  const themeMode = useSyncExternalStore(
    subscribeToTheme,
    getThemeMode,
    getServerThemeMode
  );
  const pathname = usePathname();
  const [openMenuPath, setOpenMenuPath] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuOpen = openMenuPath === pathname;

  useEffect(() => {
    initializeThemeMode();
  }, []);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuPath(null);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!authState.isLogged) {
      return;
    }

    let cancelled = false;

    const loadCurrentUser = async () => {
      const token = getStoredToken();

      if (!token) {
        return;
      }

      try {
        const response = await fetch(apiUrl('/api/auth/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthSession();
          }
          return;
        }

        const data = (await response.json()) as CurrentUserResponse;

        if (!cancelled && data.email && data.email !== authState.email) {
          setStoredUserEmail(data.email);
        }
      } catch {
        // Si esta consulta falla, conservamos la sesión local.
      }
    };

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, [authState.email, authState.isLogged, authState.token]);

  const logout = () => {
    setOpenMenuPath(null);
    clearAuthSession();
    window.location.href = '/inicio';
  };

  const displayName = getUserDisplayName(authState.email);
  const initials = getUserInitials(authState.email);
  const nextThemeLabel =
    themeMode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro';

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border-color)] bg-[var(--surface-overlay)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4 lg:px-10">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-3 sm:items-center">
            <Link
              href="/inicio"
              className="group relative flex shrink-0 items-center"
            >
              <Image
                src="/logoNuevo.png"
                alt="Logo"
                width={220}
                height={220}
                className="h-12 w-auto object-contain transition duration-300 group-hover:scale-105 sm:h-20 lg:h-28"
                priority
              />
              <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-[var(--accent)] transition-all duration-300 group-hover:w-full"></span>
            </Link>

            <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={toggleThemeMode}
                aria-label={nextThemeLabel}
                title={nextThemeLabel}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] p-1 text-sm font-medium text-[var(--text-primary)] shadow-sm hover:border-[var(--accent)] sm:h-auto sm:w-auto sm:gap-3 sm:px-3 sm:py-2"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-muted)] text-[var(--accent)] sm:h-10 sm:w-10">
                  {themeMode === 'dark' ? (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v2.25M12 18.75V21M4.93 4.93l1.59 1.59M17.48 17.48l1.59 1.59M3 12h2.25M18.75 12H21M4.93 19.07l1.59-1.59M17.48 6.52l1.59-1.59M15.75 12A3.75 3.75 0 1 1 8.25 12a3.75 3.75 0 0 1 7.5 0Z"
                      />
                    </svg>
                  ) : (
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 12.79A9 9 0 0 1 11.21 3 7.5 7.5 0 1 0 21 12.79Z"
                      />
                    </svg>
                  )}
                </span>

                <span className="hidden xl:inline">
                  {themeMode === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                </span>
              </button>

              {!authState.isLogged ? (
                <>
                  <Link
                    href="/login"
                    className="secondary-button whitespace-nowrap px-3 py-2 text-xs sm:px-4 sm:text-sm"
                  >
                    Iniciar sesión
                  </Link>

                  <Link
                    href="/register"
                    className="primary-button whitespace-nowrap px-3 py-2 text-xs sm:px-4 sm:text-sm"
                  >
                    Crear cuenta
                  </Link>
                </>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMenuPath((current) =>
                        current === pathname ? null : pathname
                      )
                    }
                    className="flex items-center gap-3 rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-3 py-2 shadow-sm hover:border-[var(--accent)]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--text-primary)] text-sm font-semibold text-[var(--page-bg)]">
                      {initials}
                    </span>

                    <span className="hidden text-left leading-tight sm:block">
                      <span className="block max-w-36 truncate text-sm font-semibold text-[var(--text-primary)]">
                        {displayName}
                      </span>
                      <span className="block text-xs text-[var(--text-tertiary)]">
                        {authState.isAdmin ? 'Administrador' : 'Usuario'}
                      </span>
                    </span>

                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className={`h-4 w-4 text-[var(--text-tertiary)] transition ${
                        menuOpen ? 'rotate-180' : ''
                      }`}
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 z-50 mt-3 w-72 rounded-[1.5rem] border border-[var(--border-color)] bg-[var(--surface-strong)] p-4 shadow-2xl">
                      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-4">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--text-primary)] font-semibold text-[var(--page-bg)]">
                          {initials}
                        </span>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[var(--text-primary)]">
                            {displayName}
                          </p>
                          <p className="truncate text-sm text-[var(--text-tertiary)]">
                            {authState.email ?? 'Usuario autenticado'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-4">
                        <button
                          type="button"
                          onClick={() => setOpenMenuPath(null)}
                          className="neutral-button w-full text-sm"
                        >
                          Seguir aquí
                        </button>

                        <button
                          type="button"
                          onClick={logout}
                          className="danger-button w-full text-sm"
                        >
                          Cerrar sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="-mx-4 flex items-center gap-5 overflow-x-auto px-4 pb-1 text-sm font-semibold text-[var(--text-secondary)] [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:text-base lg:gap-7 [&::-webkit-scrollbar]:hidden">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 whitespace-nowrap rounded-xl px-1 py-2 transition md:px-2 ${
                  pathname === link.href
                    ? 'text-[var(--accent)] underline underline-offset-4'
                    : 'hover:text-[var(--accent)]'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {authState.isAdmin && (
              <Link
                href="/admin"
                className={`shrink-0 whitespace-nowrap rounded-xl px-1 py-2 transition md:px-2 ${
                  pathname === '/admin'
                    ? 'text-[var(--accent)] underline underline-offset-4'
                    : 'hover:text-[var(--accent)]'
                }`}
              >
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
