'use client';

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
};

type NoticiasCache = {
  articles: Noticia[];
  fetchedAt: number;
};

const NEWS_CACHE_KEY = 'noticias-cache-v1';

function formatTimestamp(value: number) {
  const date = new Date(value);
  return `${date.toLocaleDateString()} - ${date.toLocaleTimeString()}`;
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

    if (!Array.isArray(parsed.articles) || typeof parsed.fetchedAt !== 'number') {
      return null;
    }

    return {
      articles: parsed.articles as Noticia[],
      fetchedAt: parsed.fetchedAt,
    };
  } catch {
    return null;
  }
}

function saveNoticiasCache(cache: NoticiasCache) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
}

export default function Noticias() {
  const [news, setNews] = useState<Noticia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [ultimaActualizacion, setUltimaActualizacion] = useState('');
  const [bloqueado, setBloqueado] = useState(false);
  const initialFetchStarted = useRef(false);

  const cargarNoticias = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');
      setWarning('');

      const endpoint = forceRefresh ? '/api/noticias?refresh=1' : '/api/noticias';
      const res = await fetch(endpoint, { cache: 'no-store' });

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudieron cargar las noticias')
        );
      }

      const data = (await res.json()) as NoticiasResponse;
      const articles = data.articles ?? [];
      const fetchedAt = data.fetchedAt ?? Date.now();

      setNews(articles);
      setWarning(data.warning ?? '');
      setUltimaActualizacion(formatTimestamp(fetchedAt));
      saveNoticiasCache({ articles, fetchedAt });
    } catch (requestError) {
      const cachedNews = readNoticiasCache();

      if (cachedNews) {
        setNews(cachedNews.articles);
        setUltimaActualizacion(formatTimestamp(cachedNews.fetchedAt));
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

  const actualizarNoticias = () => {
    if (bloqueado) {
      return;
    }

    setBloqueado(true);
    void cargarNoticias(true);

    window.setTimeout(() => {
      setBloqueado(false);
    }, 10000);
  };

  useEffect(() => {
    const cachedNews = readNoticiasCache();

    if (cachedNews) {
      setNews(cachedNews.articles);
      setUltimaActualizacion(formatTimestamp(cachedNews.fetchedAt));
      setLoading(false);
    }
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
          Noticias juridicas
        </h1>

        <div className="mx-auto accent-divider"></div>

        <p className="mb-4 mt-3 text-sm text-[var(--text-secondary)] md:text-base">
          Actualidad legal y juridica en Costa Rica
        </p>

        <button
          type="button"
          onClick={actualizarNoticias}
          disabled={bloqueado}
          className={`rounded-2xl px-5 py-3 text-sm font-semibold transition ${
            bloqueado
              ? 'cursor-not-allowed bg-[var(--surface-muted)] text-[var(--text-tertiary)]'
              : 'primary-button'
          }`}
        >
          {bloqueado ? 'Espera...' : 'Actualizar noticias'}
        </button>

        {ultimaActualizacion && (
          <p className="mt-3 text-xs text-[var(--text-tertiary)]">
            Ultima actualizacion: {ultimaActualizacion}
          </p>
        )}
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
            {news.map((item, index) => (
              <div
                key={`${item.url}-${index}`}
                className="panel-surface overflow-hidden rounded-[2rem]"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-52 w-full object-cover"
                  />
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
                    Leer mas
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && news.length === 0 && !error && (
          <p className="text-center text-[var(--text-tertiary)]">
            No hay noticias disponibles
          </p>
        )}
      </section>
    </main>
  );
}
