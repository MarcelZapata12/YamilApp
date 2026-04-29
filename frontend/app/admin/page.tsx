'use client';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { useRouter } from 'next/navigation';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';
import {
  type Articulo,
  downloadArticulo,
  openArticulo,
} from '../articulos-client';
import {
  clearAuthSession,
  getAuthState,
  getServerAuthState,
  getStoredToken,
  subscribeToAuth,
  validateAuthSession,
} from '../auth-client';
import { type Libro } from '../libros-client';
import {
  cacheSiteConfig,
  detectHeroAssetFit,
  EMPTY_SITE_CONFIG,
  fetchSiteConfig,
  getCachedSiteConfig,
  hasCachedSiteConfig,
  type HeroAssetFit,
  resolveSiteAssetUrl,
  type SiteConfig,
} from '../site-config-client';

type SiteConfigResponse = {
  msg?: string;
  configuracion?: SiteConfig;
};

export default function Admin() {
  const router = useRouter();
  const authState = useSyncExternalStore(
    subscribeToAuth,
    getAuthState,
    getServerAuthState
  );

  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [libros, setLibros] = useState<Libro[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(EMPTY_SITE_CONFIG);
  const [titulo, setTitulo] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [libroTitulo, setLibroTitulo] = useState('');
  const [libroDescripcion, setLibroDescripcion] = useState('');
  const [libroEnlace, setLibroEnlace] = useState('');
  const [heroBackgroundFile, setHeroBackgroundFile] = useState<File | null>(null);
  const [heroBackgroundPreview, setHeroBackgroundPreview] = useState<
    string | null
  >(null);
  const [heroAssetFit, setHeroAssetFit] = useState<HeroAssetFit>('cover');
  const [heroInputKey, setHeroInputKey] = useState(0);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [bookLoading, setBookLoading] = useState(false);
  const [siteLoading, setSiteLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const handleUnauthorized = useCallback(() => {
    clearAuthSession();
    setMensaje('');
    setError('Tu sesión expiró o dejó de ser válida. Inicia sesión nuevamente.');
    router.push('/login');
  }, [router]);

  const assertAuthorizedResponse = useCallback(
    async (response: Response, fallback: string) => {
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Tu sesión expiró o dejó de ser válida. Inicia sesión nuevamente.');
      }

      if (!response.ok) {
        throw new Error(await getResponseMessage(response, fallback));
      }
    },
    [handleUnauthorized]
  );

  const cargarArticulos = useCallback(async () => {
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
  }, []);

  const cargarLibros = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/libros'));

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'Error cargando libros recomendados')
        );
      }

      const data = (await res.json()) as Libro[];
      setLibros(data);
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'Error cargando libros recomendados')
      );
    }
  }, []);

  const cargarConfiguracionSitio = useCallback(async () => {
    try {
      const config = await fetchSiteConfig();
      setSiteConfig(config);
      return config;
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'Error al cargar la portada del inicio')
      );
      return null;
    }
  }, []);

  useEffect(() => {
    if (!heroBackgroundFile) {
      setHeroBackgroundPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(heroBackgroundFile);
    setHeroBackgroundPreview(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [heroBackgroundFile]);

  useEffect(() => {
    let cancelled = false;

    const initializeAdmin = async () => {
      if (!authState.token) {
        router.push('/login');
        return;
      }

      if (!authState.isAdmin) {
        router.push('/inicio');
        return;
      }

      const isValidSession = await validateAuthSession(authState.token);

      if (!isValidSession) {
        if (!cancelled) {
          handleUnauthorized();
        }
        return;
      }

      if (hasCachedSiteConfig()) {
        setSiteConfig(getCachedSiteConfig());
      }

      if (!cancelled) {
        await Promise.all([
          cargarArticulos(),
          cargarLibros(),
          cargarConfiguracionSitio(),
        ]);
      }
    };

    void initializeAdmin();

    return () => {
      cancelled = true;
    };
  }, [
    authState.isAdmin,
    authState.token,
    cargarArticulos,
    cargarConfiguracionSitio,
    cargarLibros,
    handleUnauthorized,
    router,
  ]);

  const handleSubmitHeroBackground = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const token = getStoredToken();

    if (!token) {
      router.push('/login');
      return;
    }

    if (!heroBackgroundFile) {
      setError('Debes seleccionar una imagen para la portada del inicio');
      return;
    }

    if (!heroBackgroundFile.type.startsWith('image/')) {
      setError('Solo se permiten imágenes para la portada');
      return;
    }

    try {
      setSiteLoading(true);
      const previousUpdatedAt = siteConfig.heroBackgroundImageUpdatedAt;

      const formData = new FormData();
      formData.append('imagen', heroBackgroundFile);

      const res = await fetch(
        apiUrl('/api/configuracion-sitio/portada/imagen'),
        {
          method: 'PUT',
          body: formData,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const payload = (await res
        .json()
        .catch(() => null)) as SiteConfigResponse | null;

      if (res.status === 401) {
        handleUnauthorized();
        throw new Error('Tu sesión expiró o dejó de ser válida. Inicia sesión nuevamente.');
      }

      if (!res.ok) {
        throw new Error(payload?.msg ?? 'Error al actualizar la portada');
      }

      if (payload?.configuracion) {
        setSiteConfig(cacheSiteConfig(payload.configuracion));
      }

      const refreshedConfig = await cargarConfiguracionSitio();

      setHeroBackgroundFile(null);
      setHeroInputKey((current) => current + 1);
      setMensaje(
        refreshedConfig?.heroBackgroundImageUpdatedAt &&
          refreshedConfig.heroBackgroundImageUpdatedAt !== previousUpdatedAt
          ? 'La portada del inicio fue actualizada correctamente'
          : 'La portada se guardó y fue actualizada correctamente'
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Error al actualizar la portada'));
    } finally {
      setSiteLoading(false);
    }
  };

  const handleSubmitArticulo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const token = getStoredToken();

    if (!token) {
      router.push('/login');
      return;
    }

    if (!archivo) {
      setError('Debes seleccionar un archivo');
      return;
    }

    if (archivo.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF');
      return;
    }

    try {
      setDocumentLoading(true);

      const formData = new FormData();
      formData.append('titulo', titulo);
      formData.append('archivo', archivo);

      const res = await fetch(apiUrl('/api/articulos'), {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await assertAuthorizedResponse(res, 'Error al subir archivo');

      setMensaje('Documento subido correctamente');
      setTitulo('');
      setArchivo(null);
      setFileInputKey((current) => current + 1);
      await cargarArticulos();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Error al subir archivo'));
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleSubmitLibro = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const token = getStoredToken();

    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setBookLoading(true);

      const res = await fetch(apiUrl('/api/libros'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          titulo: libroTitulo,
          descripcion: libroDescripcion,
          enlaceCompra: libroEnlace,
        }),
      });

      await assertAuthorizedResponse(
        res,
        'Error al guardar el libro recomendado'
      );

      setMensaje('Libro recomendado agregado correctamente');
      setLibroTitulo('');
      setLibroDescripcion('');
      setLibroEnlace('');
      await cargarLibros();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'Error guardando el libro recomendado')
      );
    } finally {
      setBookLoading(false);
    }
  };

  const eliminarArticulo = async (id: string) => {
    const token = getStoredToken();

    if (!token) {
      router.push('/login');
      return;
    }

    if (!confirm('¿Eliminar este documento?')) {
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/articulos/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await assertAuthorizedResponse(res, 'Error al eliminar');

      setMensaje('Documento eliminado correctamente');
      setError('');
      await cargarArticulos();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Error al eliminar'));
    }
  };

  const eliminarLibro = async (id: string) => {
    const token = getStoredToken();

    if (!token) {
      router.push('/login');
      return;
    }

    if (!confirm('¿Eliminar esta recomendación de libro?')) {
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/libros/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await assertAuthorizedResponse(res, 'Error al eliminar');

      setMensaje('Libro recomendado eliminado correctamente');
      setError('');
      await cargarLibros();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Error al eliminar'));
    }
  };

  const handleFileAction = async (
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

  const currentHeroBackgroundUrl =
    heroBackgroundPreview ??
    (siteConfig.heroBackgroundImageUrl
      ? resolveSiteAssetUrl(
          siteConfig.heroBackgroundImageUrl,
          siteConfig.heroBackgroundImageUpdatedAt
        )
      : null);
  const currentHeroBackgroundFit = heroBackgroundFile
    ? heroAssetFit
    : siteConfig.heroBackgroundImageFit ??
      (siteConfig.heroBackgroundImageUrl ? 'contain' : 'cover');
  const isContainedHeroAsset = currentHeroBackgroundFit === 'contain';

  useEffect(() => {
    if (!heroBackgroundPreview) {
      setHeroAssetFit(siteConfig.heroBackgroundImageFit ?? 'cover');
      return;
    }

    let cancelled = false;

    void detectHeroAssetFit(heroBackgroundPreview).then((fit) => {
      if (!cancelled) {
        setHeroAssetFit(fit);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [heroBackgroundPreview, siteConfig.heroBackgroundImageFit]);

  if (!authState.isAdmin) {
    return (
      <div className="page-shell flex h-screen items-center justify-center">
        <p className="text-[var(--text-secondary)]">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <main className="page-shell">
      <section className="hero-surface border-b border-[var(--border-color)] py-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-wide md:text-5xl">
          Panel administrativo
        </h1>
        <div className="mx-auto accent-divider"></div>
        <p className="mt-3 text-sm text-[var(--text-secondary)] md:text-base">
          Gestión de portada, documentos y recomendaciones de lectura.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-12">
        {mensaje && (
          <div className="mb-6 text-center font-medium status-success">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-6 text-center font-medium status-error">
            {error}
          </div>
        )}

        <div className="panel-surface mb-12 rounded-[2rem] p-6">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Portada del inicio</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Aquí puedes cambiar la imagen difuminada que aparece detrás del
                hero principal del inicio.
              </p>
            </div>

            <span className="rounded-full bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
              Hero editable
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[#f6f1e8]">
              <div className="absolute inset-0 bg-[#f6f1e8]"></div>

              {currentHeroBackgroundUrl && (
                <>
                  {isContainedHeroAsset ? (
                    <div className="absolute inset-0 flex items-center justify-end px-5">
                      <div className="relative h-[80%] w-[122%] max-w-[580px] opacity-84">
                        <div
                          aria-hidden="true"
                          className="h-full w-full blur-[0.95px]"
                          style={{
                            backgroundImage: `url("${currentHeroBackgroundUrl}")`,
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundSize: 'contain',
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 scale-[1.03] blur-[1.1px] opacity-72"
                      style={{
                        backgroundImage: `url("${currentHeroBackgroundUrl}")`,
                        backgroundPosition: 'center 22%',
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: 'cover',
                      }}
                    />
                  )}
                </>
              )}

              {!currentHeroBackgroundUrl && (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_right,rgba(210,173,98,0.08),transparent_34%)]"></div>
              )}

              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_28%),radial-gradient(circle_at_center_right,rgba(255,255,255,0.08),transparent_34%),linear-gradient(90deg,rgba(250,247,242,0.88)_0%,rgba(250,247,242,0.72)_40%,rgba(250,247,242,0.24)_72%,rgba(250,247,242,0.04)_100%)]"></div>
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.08)_100%)]"></div>

              <div className="relative flex h-full flex-col justify-end p-6 text-[#171717]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#d2ad62]">
                  Vista previa
                </p>
                <h3
                  className="mt-4 max-w-md text-4xl font-semibold leading-none md:text-5xl"
                  style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  Hero de inicio
                </h3>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-[#4a4337]">
                  El fondo conservará su color original con un desenfoque suave
                  para acompañar el hero sin quitar protagonismo al contenido
                  principal.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitHeroBackground} className="space-y-4">
              {currentHeroBackgroundUrl && (
                <div className="overflow-hidden rounded-[1.75rem] border border-[var(--border-color)] bg-[var(--surface-strong)] p-4">
                  <p className="text-sm font-medium">Imagen actual cargada</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Aquí debes poder verla claramente aunque la portada final la
                    use de forma difuminada.
                  </p>

                  <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-[1.25rem] bg-[var(--surface-muted)]">
                    {currentHeroBackgroundUrl ? (
                      <div
                        aria-label="Imagen actual de portada"
                        className="h-full w-full"
                        style={{
                          backgroundImage: `url("${currentHeroBackgroundUrl}")`,
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: 'contain',
                        }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-[var(--text-secondary)]">
                        No se pudo mostrar la imagen guardada en este momento.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4">
                <label className="secondary-button cursor-pointer px-4 py-2">
                  Seleccionar imagen
                  <input
                    key={heroInputKey}
                    type="file"
                    accept="image/*"
                    onChange={(event) =>
                      setHeroBackgroundFile(event.target.files?.[0] || null)
                    }
                    className="hidden"
                  />
                </label>

                <span className="text-sm text-[var(--text-secondary)]">
                  {heroBackgroundFile
                    ? heroBackgroundFile.name
                    : siteConfig.heroBackgroundImageUrl
                    ? 'Usando la imagen actual guardada'
                    : 'Aún no hay una imagen configurada'}
                </span>
              </div>

              <button
                type="submit"
                disabled={siteLoading}
                className="primary-button px-6 py-2 disabled:opacity-50"
              >
                {siteLoading ? 'Guardando...' : 'Guardar portada'}
              </button>
            </form>
          </div>
        </div>

        <div className="panel-surface mb-12 rounded-[2rem] p-6">
          <h2 className="mb-6 text-xl font-semibold">Subir documento</h2>

          <form onSubmit={handleSubmitArticulo} className="space-y-4">
            <input
              type="text"
              placeholder="Título del documento"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              className="input-field"
              required
            />

            <div className="flex flex-wrap items-center gap-4">
              <label className="secondary-button cursor-pointer px-4 py-2">
                Seleccionar PDF
                <input
                  key={fileInputKey}
                  type="file"
                  accept="application/pdf"
                  onChange={(event) =>
                    setArchivo(event.target.files?.[0] || null)
                  }
                  className="hidden"
                />
              </label>

              <span className="text-sm text-[var(--text-secondary)]">
                {archivo ? archivo.name : 'Ningún archivo seleccionado'}
              </span>
            </div>

            <button
              type="submit"
              disabled={documentLoading}
              className="primary-button px-6 py-2 disabled:opacity-50"
            >
              {documentLoading ? 'Subiendo...' : 'Subir documento'}
            </button>
          </form>
        </div>

        <div className="panel-surface mb-12 rounded-[2rem] p-6">
          <h2 className="mb-6 text-xl font-semibold">
            Recomendar libro para compra
          </h2>

          <form onSubmit={handleSubmitLibro} className="space-y-4">
            <input
              type="text"
              placeholder="Título del libro"
              value={libroTitulo}
              onChange={(event) => setLibroTitulo(event.target.value)}
              className="input-field"
              required
            />

            <textarea
              placeholder="Pequeña descripción del libro"
              value={libroDescripcion}
              onChange={(event) => setLibroDescripcion(event.target.value)}
              className="textarea-field"
              required
            />

            <input
              type="text"
              placeholder="Enlace del sitio oficial donde se compra"
              value={libroEnlace}
              onChange={(event) => setLibroEnlace(event.target.value)}
              className="input-field"
              required
            />

            <button
              type="submit"
              disabled={bookLoading}
              className="neutral-button px-6 py-2 disabled:opacity-50"
            >
              {bookLoading ? 'Guardando...' : 'Guardar recomendación'}
            </button>
          </form>
        </div>

        <div className="mb-12">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Documentos publicados</h2>
            <span className="text-sm text-[var(--text-secondary)]">
              {articulos.length} documento(s)
            </span>
          </div>

          <div className="space-y-4">
            {articulos.map((articulo) => (
              <div
                key={articulo._id}
                className="panel-surface flex items-center justify-between rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
              >
                <div>
                  <h3 className="text-lg font-semibold">{articulo.titulo}</h3>
                  <p className="text-sm text-[var(--text-tertiary)]">PDF</p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void handleFileAction(
                        () => openArticulo(articulo),
                        'No se pudo abrir el documento'
                      )
                    }
                    className="secondary-button px-4 py-2"
                  >
                    Ver
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleFileAction(
                        () => downloadArticulo(articulo),
                        'No se pudo descargar el documento'
                      )
                    }
                    className="primary-button px-4 py-2"
                  >
                    Descargar
                  </button>

                  <button
                    type="button"
                    onClick={() => void eliminarArticulo(articulo._id)}
                    className="danger-button px-4 py-2"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-2xl font-semibold">Libros recomendados</h2>
            <span className="text-sm text-[var(--text-secondary)]">
              {libros.length} recomendación(es)
            </span>
          </div>

          <div className="space-y-4">
            {libros.map((libro) => (
              <div
                key={libro._id}
                className="panel-surface rounded-[1.75rem] p-5 transition hover:-translate-y-0.5"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <h3 className="mb-2 text-lg font-semibold">
                      {libro.titulo}
                    </h3>
                    <p className="mb-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {libro.descripcion}
                    </p>
                    <a
                      href={libro.enlaceCompra}
                      className="break-all text-sm text-[var(--accent)] hover:underline"
                    >
                      {libro.enlaceCompra}
                    </a>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <a
                      href={libro.enlaceCompra}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="secondary-button px-4 py-2"
                    >
                      Ver enlace
                    </a>

                    <button
                      type="button"
                      onClick={() => void eliminarLibro(libro._id)}
                      className="danger-button px-4 py-2"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
