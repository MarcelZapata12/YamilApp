'use client';

import { useEffect, useState } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';
import {
  type Articulo,
  downloadArticulo,
  openArticulo,
} from '../articulos-client';

export default function Documentos() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarArticulos = async () => {
      try {
        const res = await fetch(apiUrl('/api/articulos'));

        if (!res.ok) {
          throw new Error(
            await getResponseMessage(res, 'Error cargando documentos')
          );
        }

        const data = (await res.json()) as Articulo[];
        setArticulos(data);
      } catch (requestError) {
        setError(getErrorMessage(requestError, 'Error cargando documentos'));
      }
    };

    void cargarArticulos();
  }, []);

  const terminoBusqueda = busqueda.toLowerCase();
  const articulosFiltrados = articulos.filter((articulo) => {
    const descripcion = articulo.descripcion ?? '';

    return `${articulo.titulo} ${descripcion}`
      .toLowerCase()
      .includes(terminoBusqueda);
  });

  const handleAction = async (
    action: () => Promise<boolean>,
    fallback: string
  ) => {
    try {
      setError('');
      await action();
    } catch (requestError) {
      setError(getErrorMessage(requestError, fallback));
    }
  };

  return (
    <main className="page-shell">
      <section className="hero-surface border-b border-[var(--border-color)] py-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-wide md:text-5xl">
          Biblioteca
        </h1>

        <div className="mx-auto accent-divider"></div>

        <p className="mt-3 text-sm text-[var(--text-secondary)] md:text-base">
          Documentos jurídicos disponibles para consulta y descarga.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {error && (
          <div className="mb-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-strong)] px-5 py-4 text-center text-sm status-error">
            {error}
          </div>
        )}

        <div className="mb-8">
          <input
            type="text"
            placeholder="Buscar documento..."
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="input-field"
          />
        </div>

        <div className="space-y-4">
          {articulosFiltrados.map((articulo) => (
            <div
              key={articulo._id}
              className="panel-surface flex flex-col gap-5 rounded-[1.75rem] p-5 transition hover:-translate-y-0.5 md:flex-row md:items-start md:justify-between md:p-6"
            >
              <div className="min-w-0 flex-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
                  Documento
                </p>
                <h3 className="max-w-4xl text-xl font-semibold leading-snug text-[var(--text-primary)]">
                  {articulo.titulo}
                </h3>
                {articulo.descripcion && (
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                    {articulo.descripcion}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 md:shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    void handleAction(
                      () => openArticulo(articulo),
                      'No se pudo abrir el documento'
                    )
                  }
                  className="secondary-button px-4 py-2 text-sm"
                >
                  Ver
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleAction(
                      () => downloadArticulo(articulo),
                      'No se pudo descargar el documento'
                    )
                  }
                  className="primary-button px-4 py-2 text-sm"
                >
                  Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
