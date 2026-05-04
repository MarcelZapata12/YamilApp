'use client';

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useRef, useState } from 'react';

import { getErrorMessage, getResponseMessage } from '../api-client';

type Noticia = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
};

type NoticiasResponse = {
  articles?: Noticia[];
  warning?: string;
  fetchedAt?: number;
  refreshHour?: number;
};

type NoticiasCache = {
  articles: Noticia[];
  fetchedAt: number;
  refreshHour?: number;
};

const NEWS_CACHE_KEY = 'noticias-cache-v2';
const COSTA_RICA_TIME_ZONE = 'America/Costa_Rica';
const DEFAULT_REFRESH_HOUR = 6;

function formatTimestamp(value: number) {
  return new Intl.DateTimeFormat('es-CR', {
    timeZone: COSTA_RICA_TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function readNoticiasCache(): NoticiasCache | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(NEWS_CACHE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as Partial<NoticiasCache>;

    if (
      !Array.isArray(parsed.articles) ||
      parsed.articles.length === 0 ||
      typeof parsed.fetchedAt !== 'number'
    ) {
      return null;
    }

    return {
      articles: parsed.articles as Noticia[],
      fetchedAt: parsed.fetchedAt,
      refreshHour: parsed.refreshHour,
    };
  } catch {
    return null;
  }
}

function saveNoticiasCache(cache: NoticiasCache) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // La cache local es solo respaldo; si falla, la pagina sigue funcionando.
  }
}

export default function Noticias() {
  const [news, setNews] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');
  const [horaActualizacion, setHoraActualizacion] = useState(
    DEFAULT_REFRESH_HOUR
  );
  const [imagenesConError, setImagenesConError] = useState<Set<string>>(
    () => new Set()
  );
  const initialFetchStarted = useRef(false);

  const cargarNoticias = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setWarning('');

      const res = await fetch('/api/noticias');

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudieron cargar las noticias')
        );
      }

      const data = (await res.json()) as NoticiasResponse;
      const articles = data.articles ?? [];
      const fetchedAt = data.fetchedAt ?? Date.now();
      const refreshHour = data.refreshHour ?? DEFAULT_REFRESH_HOUR;

      setNews(articles);
      setWarning(data.warning ?? '');
      setUltimaActualizacion(formatTimestamp(fetchedAt));
      setHoraActualizacion(refreshHour);
      setImagenesConError(new Set());

      if (articles.length > 0) {
        saveNoticiasCache({ articles, fetchedAt, refreshHour });
      }
    } catch (requestError) {
      const cachedNews = readNoticiasCache();

      if (cachedNews) {
        setNews(cachedNews.articles);
        setUltimaActualizacion(formatTimestamp(cachedNews.fetchedAt));
        setHoraActualizacion(cachedNews.refreshHour ?? DEFAULT_REFRESH_HOUR);
        setWarning(
          'Mostrando noticias guardadas localmente mientras el proveedor se recupera.'
        );
      } else {
        setError(
          getErrorMessage(
            requestError,
            'No se pudieron cargar las noticias en este momento'
          )
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const marcarImagenConError = useCallback((imageKey: string) => {
    setImagenesConError((current) => {
      if (current.has(imageKey)) {
        return current;
      }

      const next = new Set(current);
      next.add(imageKey);
      return next;
    });
  }, []);

  useEffect(() => {
    if (initialFetchStarted.current) {
      return;
    }

    initialFetchStarted.current = true;
    void cargarNoticias();
  }, [cargarNoticias]);

  return (
    <main className="page-shell">
      <section className="hero-surface border-b border-[var(--border-color)] py-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-wide md:text-5xl">
          Noticias jurídicas
        </h1>

        <div className="mx-auto accent-divider"></div>

        <p className="mb-4 mt-3 text-sm text-[var(--text-secondary)] md:text-base">
          Actualidad en el mundo.
        </p>

        {ultimaActualizacion && (
          <p className="mt-4 text-xs text-[var(--text-tertiary)]">
            Última actualización: {ultimaActualizacion}
          </p>
        )}

        <p className="mt-1 text-xs text-[var(--text-tertiary)]">
          Actualización automática diaria a las {horaActualizacion}:00 a. m.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {loading && (
          <p className="animate-pulse text-center text-[var(--text-tertiary)]">
            Cargando noticias...
          </p>
        )}

        {warning && (
          <p className="mb-4 text-center text-amber-700">{warning}</p>
        )}

        {error && <p className="text-center status-error">{error}</p>}

        {!loading && news.length > 0 && (
          <div className="grid gap-8 md:grid-cols-2">
            {news.map((item, index) => {
              const imageKey = `${item.url}-${item.image ?? index}`;
              const shouldShowImage = Boolean(
                item.image && !imagenesConError.has(imageKey)
              );

              return (
                <div
                  key={`${item.url}-${index}`}
                  className="panel-surface overflow-hidden rounded-[2rem]"
                >
                  {shouldShowImage ? (
                    <img
                      src={item.image ?? ''}
                      alt=""
                      aria-hidden="true"
                      loading={index > 1 ? 'lazy' : 'eager'}
                      decoding="async"
                      onError={() => marcarImagenConError(imageKey)}
                      className="h-52 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-52 w-full items-center justify-center border-b border-[var(--border-color)] bg-[var(--surface-muted)] px-6 text-center">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">
                        Sin imagen disponible
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <h2 className="mb-3 text-lg font-semibold leading-snug">
                      {item.title}
                    </h2>

                    <p className="mb-5 line-clamp-3 text-sm text-[var(--text-secondary)]">
                      {item.description}
                    </p>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button px-4 py-2 text-sm"
                    >
                      Leer más
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && news.length === 0 && !error && (
          <p className="text-center text-[var(--text-tertiary)]">
            No hay noticias disponibles.
          </p>
        )}
      </section>
    </main>
  );
}
