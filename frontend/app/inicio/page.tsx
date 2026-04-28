'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';
import {
  EMPTY_SITE_CONFIG,
  fetchSiteConfig,
  getCachedSiteConfig,
  hasCachedSiteConfig,
  resolveSiteAssetUrl,
  type SiteConfig,
} from '../site-config-client';

type Evento = {
  _id?: string;
  titulo: string;
  fecha: string;
  tipo: 'Legal' | 'Economico' | 'Otro';
  importante?: boolean;
};

function getTipoEventoLabel(tipo: Evento['tipo']) {
  if (tipo === 'Economico') {
    return 'Económico';
  }

  return tipo;
}

function parseEventDate(date: string) {
  const normalizedDate = date.includes('T') ? date.split('T')[0] : date;
  return new Date(`${normalizedDate}T00:00:00`);
}

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat('es-CR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parseEventDate(date));
}

function isUpcomingEvent(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseEventDate(date) >= today;
}

function getImportantReminders(eventos: Evento[]) {
  const importantes = eventos.filter((evento) => evento.importante);
  const upcoming = importantes
    .filter((evento) => isUpcomingEvent(evento.fecha))
    .sort(
      (first, second) =>
        parseEventDate(first.fecha).getTime() -
        parseEventDate(second.fecha).getTime()
    );

  if (upcoming.length > 0) {
    return upcoming.slice(0, 3);
  }

  return importantes
    .sort(
      (first, second) =>
        parseEventDate(second.fecha).getTime() -
        parseEventDate(first.fecha).getTime()
    )
    .slice(0, 3);
}

export default function Inicio() {
  const [recordatorios, setRecordatorios] = useState<Evento[]>([]);
  const [loadingRecordatorios, setLoadingRecordatorios] = useState(true);
  const [errorRecordatorios, setErrorRecordatorios] = useState('');
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(EMPTY_SITE_CONFIG);
  const [siteConfigResolved, setSiteConfigResolved] = useState(false);

  useEffect(() => {
    const cargarConfiguracion = async () => {
      const cachedConfigAvailable = hasCachedSiteConfig();

      if (cachedConfigAvailable) {
        setSiteConfig(getCachedSiteConfig());
        setSiteConfigResolved(true);
      }

      try {
        setSiteConfig(await fetchSiteConfig());
        setSiteConfigResolved(true);
      } catch {
        if (!cachedConfigAvailable) {
          setSiteConfig(EMPTY_SITE_CONFIG);
          setSiteConfigResolved(true);
        }
      }
    };

    const cargarRecordatorios = async () => {
      try {
        setLoadingRecordatorios(true);
        setErrorRecordatorios('');

        const response = await fetch(apiUrl('/api/eventos'));

        if (!response.ok) {
          throw new Error(
            await getResponseMessage(
              response,
              'No se pudieron cargar los recordatorios'
            )
          );
        }

        const eventos = (await response.json()) as Evento[];
        setRecordatorios(getImportantReminders(eventos));
      } catch (requestError) {
        setErrorRecordatorios(
          getErrorMessage(
            requestError,
            'No se pudieron cargar los recordatorios'
          )
        );
      } finally {
        setLoadingRecordatorios(false);
      }
    };

    void cargarConfiguracion();
    void cargarRecordatorios();
  }, []);

  const heroBackgroundUrl = siteConfig.heroBackgroundImageUrl
    ? resolveSiteAssetUrl(
        siteConfig.heroBackgroundImageUrl,
        siteConfig.heroBackgroundImageUpdatedAt
      )
    : null;
  const heroBackgroundFit =
    siteConfig.heroBackgroundImageFit ??
    (siteConfig.heroBackgroundImageUrl ? 'contain' : 'cover');
  const isContainedHeroAsset = heroBackgroundFit === 'contain';
  const containedHeroAssetPosition = siteConfig.heroBackgroundImageUrl
    ? '82% center'
    : '82% 22%';

  return (
    <main className="page-shell">
      <section className="relative overflow-hidden border-b border-[var(--border-color)]">
        <div className="absolute inset-0 bg-[#f6f1e8]"></div>

        {heroBackgroundUrl && !isContainedHeroAsset && (
          <div
            aria-hidden="true"
            className="absolute inset-0 scale-[1.03] blur-[1.2px] opacity-70"
            style={{
              backgroundImage: `url("${heroBackgroundUrl}")`,
              backgroundPosition: siteConfig.heroBackgroundImageUrl
                ? 'center 22%'
                : '78% center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'cover',
            }}
          />
        )}

        {heroBackgroundUrl && isContainedHeroAsset && (
          <div className="pointer-events-none absolute inset-0 flex items-start justify-end px-2 pt-6 md:items-center md:px-6 md:pt-0 lg:px-10">
            <div className="relative h-[68%] w-[138%] max-w-[920px] opacity-84 md:h-[74%] md:w-[98%] md:opacity-84 lg:h-[88%] lg:w-[78%]">
              <div
                aria-hidden="true"
                className="h-full w-full blur-[1.05px]"
                style={{
                  backgroundImage: `url("${heroBackgroundUrl}")`,
                  backgroundPosition: containedHeroAssetPosition,
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: 'contain',
                }}
              />
            </div>
          </div>
        )}

        {!heroBackgroundUrl && siteConfigResolved && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center_right,rgba(210,173,98,0.08),transparent_34%)]"></div>
        )}

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.8),transparent_30%),radial-gradient(circle_at_center_right,rgba(255,255,255,0.08),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(200,169,106,0.08),transparent_24%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(250,247,242,0.88)_0%,rgba(250,247,242,0.72)_34%,rgba(250,247,242,0.26)_60%,rgba(250,247,242,0.04)_100%)]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02)_0%,rgba(255,255,255,0.08)_100%)]"></div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1fr_0.88fr] lg:items-center lg:py-20">
          <div className="max-w-3xl text-[#171717]">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-[#d2ad62]">
              Derecho y Sociedad
            </p>

            <p
              className="mb-4 text-3xl text-[#d2ad62] md:text-4xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Yamil Chacon
            </p>

            <h1
              className="max-w-4xl text-5xl font-semibold leading-[0.98] md:text-7xl"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              Abogado y asesor legal en Costa Rica
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#3f3a32] md:text-lg">
              Brindamos asesoría jurídica estratégica, acompañamiento técnico y
              lectura normativa, con un enfoque serio, cercano y profesional
              para procesos legales, análisis legislativo y toma de decisiones.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/about" className="primary-button px-7 py-4 text-base">
                Ver acerca del abogado
              </Link>

              <Link
                href="/documentos"
                className="secondary-button border-[#c9aa6b] px-7 py-4 text-base text-[#7d6230] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--accent-contrast)]"
              >
                Explorar documentos
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px] lg:mx-0 lg:justify-self-end lg:max-w-[470px]">
            <div className="absolute -inset-3 rounded-[2.25rem] bg-[radial-gradient(circle,rgba(255,255,255,0.7),transparent_66%)] blur-2xl"></div>

            <div className="relative overflow-hidden rounded-[2.25rem] border border-[#dcc89e]/45 bg-white/55 p-4 shadow-[0_28px_70px_rgba(97,74,25,0.18)] backdrop-blur-md">
              <div className="overflow-hidden rounded-[1.8rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,239,231,0.95))] p-4">
                <Image
                  src="/perfil.jpeg"
                  alt="Perfil del abogado"
                  width={620}
                  height={500}
                  className="h-auto w-full rounded-[1.35rem] object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
              Inicio
            </p>
            <h2 className="mt-3 text-3xl font-semibold">Recordatorios clave</h2>
          </div>

          <Link href="/calendario" className="secondary-button">
            Ir al calendario
          </Link>
        </div>

        {loadingRecordatorios && (
          <div className="panel-surface rounded-[2rem] p-6 text-center text-[var(--text-secondary)]">
            Cargando recordatorios importantes...
          </div>
        )}

        {!loadingRecordatorios && errorRecordatorios && (
          <div className="panel-surface rounded-[2rem] p-6 text-center status-error">
            {errorRecordatorios}
          </div>
        )}

        {!loadingRecordatorios &&
          !errorRecordatorios &&
          recordatorios.length === 0 && (
            <div className="panel-surface rounded-[2rem] p-6 text-center text-[var(--text-secondary)]">
              Todavía no hay eventos marcados como importantes. Cuando el
              administrador los agregue, aparecerán aquí automáticamente.
            </div>
          )}

        {!loadingRecordatorios && recordatorios.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-3">
            {recordatorios.map((evento) => (
              <article
                key={evento._id}
                className="panel-surface rounded-[2rem] p-6"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
                  Recordatorio importante
                </p>
                <h3 className="mt-4 text-xl font-semibold leading-snug">
                  {evento.titulo}
                </h3>
                <p className="mt-3 text-sm text-[var(--text-secondary)]">
                  {formatEventDate(evento.fecha)}
                </p>
                <p className="mt-2 inline-flex rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  {getTipoEventoLabel(evento.tipo)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-6 py-4 text-center">
        <h2 className="text-2xl font-semibold">Valor diferencial</h2>
        <div className="mx-auto mt-4 accent-divider"></div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Experiencia legislativa',
              desc: 'Más de 29 años participando en procesos normativos y asesoría institucional.',
            },
            {
              title: 'Análisis estratégico',
              desc: 'Evaluación jurídica con criterio técnico, contexto político y lectura integral.',
            },
            {
              title: 'Resultados confiables',
              desc: 'Soluciones legales orientadas a la seguridad jurídica y a la toma de decisiones responsables.',
            },
          ].map((item) => (
            <div key={item.title} className="panel-surface rounded-[2rem] p-6">
              <h3 className="text-lg font-semibold text-[var(--accent)]">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="section-surface mt-12 border-y border-[var(--border-color)] px-6 py-14">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-2xl font-semibold">Áreas de práctica</h2>
          <div className="mx-auto mt-4 accent-divider"></div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              'Derecho penal',
              'Derecho laboral',
              'Derecho administrativo',
              'Técnica legislativa',
              'Análisis normativo',
              'Consultoría jurídica',
            ].map((area) => (
              <div key={area} className="soft-surface rounded-2xl p-5">
                <p className="font-medium text-[var(--text-primary)]">{area}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
