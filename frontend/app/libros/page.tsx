'use client';

import { useCallback, useEffect, useState } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';
import { type Libro } from '../libros-client';

export default function Libros() {
  const [libros, setLibros] = useState<Libro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cargarLibros = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(apiUrl('/api/libros'));

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudieron cargar los libros')
        );
      }

      const data = (await res.json()) as Libro[];
      setLibros(data);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudieron cargar los libros'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarLibros();
  }, [cargarLibros]);

  return (
    <main className="page-shell">
      <section className="hero-surface border-b border-[var(--border-color)] py-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-wide md:text-5xl">
          Libros recomendados
        </h1>

        <div className="mx-auto accent-divider"></div>

        <p className="mx-auto mt-3 max-w-2xl px-6 text-sm text-[var(--text-secondary)] md:text-base">
          Seleccion de lecturas sugeridas por la administracion para ampliar
          criterio juridico, formacion profesional y consulta especializada.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading && (
          <p className="text-center text-[var(--text-tertiary)] animate-pulse">
            Cargando libros recomendados...
          </p>
        )}

        {error && !loading && <p className="text-center status-error">{error}</p>}

        {!loading && !error && libros.length === 0 && (
          <div className="panel-surface rounded-[2rem] p-10 text-center">
            <h2 className="text-xl font-semibold mb-2">
              Aun no hay recomendaciones
            </h2>
            <p className="text-[var(--text-secondary)]">
              Cuando el administrador agregue libros, apareceran aqui con su
              enlace de compra oficial.
            </p>
          </div>
        )}

        {!loading && libros.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-2">
            {libros.map((libro) => (
              <article
                key={libro._id}
                className="panel-surface rounded-[2rem] p-6 transition hover:-translate-y-0.5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                      Recomendacion
                    </p>
                    <h2 className="text-2xl font-semibold leading-tight">
                      {libro.titulo}
                    </h2>
                  </div>

                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--inverse-bg)] text-lg font-semibold text-[var(--inverse-text)]">
                    L
                  </span>
                </div>

                <p className="mb-6 leading-relaxed text-[var(--text-secondary)]">
                  {libro.descripcion}
                </p>

                <a
                  href={libro.enlaceCompra}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-button text-sm"
                >
                  Comprar en sitio oficial
                </a>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
