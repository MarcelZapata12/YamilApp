'use client';

import type {
  EventClickArg,
  EventContentArg,
  EventInput,
} from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import { type FormEvent, useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';
import {
  getAuthState,
  getServerAuthState,
  getStoredToken,
  subscribeToAuth,
} from '../auth-client';

type EventoTipo = 'Legal' | 'Economico' | 'Otro';

type Evento = {
  _id?: string;
  titulo: string;
  fecha: string;
  tipo: EventoTipo;
  importante?: boolean;
};

type HolidayApiItem = {
  localName: string;
  date: string;
};

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
    return upcoming.slice(0, 4);
  }

  return importantes
    .sort(
      (first, second) =>
        parseEventDate(second.fecha).getTime() -
        parseEventDate(first.fecha).getTime()
    )
    .slice(0, 4);
}

function getColor(eventoTipo: EventoTipo | 'Feriado') {
  if (eventoTipo === 'Legal') {
    return '#c8a96a';
  }

  if (eventoTipo === 'Economico') {
    return '#1f9d69';
  }

  if (eventoTipo === 'Feriado') {
    return '#dc2626';
  }

  return '#7a5d35';
}

export default function Calendario() {
  const authState = useSyncExternalStore(
    subscribeToAuth,
    getAuthState,
    getServerAuthState
  );

  const [eventosCalendario, setEventosCalendario] = useState<EventInput[]>([]);
  const [eventosInternos, setEventosInternos] = useState<Evento[]>([]);
  const [cantidadFeriados, setCantidadFeriados] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [eventoId, setEventoId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [tipo, setTipo] = useState<EventoTipo>('Legal');
  const [importante, setImportante] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [isCompactCalendar, setIsCompactCalendar] = useState(false);

  const cargarEventos = useCallback(async () => {
    try {
      setError('');

      const resDB = await fetch(apiUrl('/api/eventos'));

      if (!resDB.ok) {
        throw new Error(await getResponseMessage(resDB, 'Error cargando eventos'));
      }

      const dataDB = (await resDB.json()) as Evento[];
      setEventosInternos(dataDB);

      const eventosDB: EventInput[] = dataDB.map((evento) => ({
        id: evento._id,
        title: evento.titulo,
        date: evento.fecha,
        backgroundColor: getColor(evento.tipo),
        extendedProps: evento,
      }));

      let feriados: EventInput[] = [];

      try {
        const currentYear = new Date().getFullYear();
        const resAPI = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${currentYear}/CR`
        );

        if (resAPI.ok) {
          const dataAPI = (await resAPI.json()) as HolidayApiItem[];
          feriados = dataAPI.map((feriado) => ({
            title: `CR ${feriado.localName}`,
            date: feriado.date,
            backgroundColor: getColor('Feriado'),
            extendedProps: {
              tipo: 'Feriado',
              importante: false,
            },
          }));
        }
      } catch {
        // Si el proveedor externo falla, seguimos mostrando los eventos internos.
      }

      setCantidadFeriados(feriados.length);
      setEventosCalendario([...eventosDB, ...feriados]);
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Error cargando eventos'));
    }
  }, []);

  useEffect(() => {
    void cargarEventos();
  }, [cargarEventos]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 640px)');
    const syncCompactCalendar = () => {
      setIsCompactCalendar(mediaQuery.matches);
    };

    syncCompactCalendar();
    mediaQuery.addEventListener('change', syncCompactCalendar);

    return () => {
      mediaQuery.removeEventListener('change', syncCompactCalendar);
    };
  }, []);

  const abrirNuevo = () => {
    if (!authState.isAdmin) {
      return;
    }

    setTitulo('');
    setFecha('');
    setTipo('Legal');
    setImportante(false);
    setEditando(false);
    setEventoId('');
    setModalOpen(true);
    setMensaje('');
    setError('');
  };

  const handleEventClick = (info: EventClickArg) => {
    if (!authState.isAdmin || !info.event.id) {
      return;
    }

    const evento = info.event.extendedProps as Evento;

    setTitulo(evento.titulo);
    setFecha(evento.fecha.split('T')[0]);
    setTipo(evento.tipo);
    setImportante(Boolean(evento.importante));
    setEventoId(info.event.id);
    setEditando(true);
    setModalOpen(true);
    setMensaje('');
    setError('');
  };

  const guardarEvento = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    const token = getStoredToken();

    if (!token) {
      setError('No estas logueado');
      return;
    }

    if (!titulo || !fecha) {
      setError('Todos los campos son obligatorios');
      return;
    }

    const url = editando
      ? apiUrl(`/api/eventos/${eventoId}`)
      : apiUrl('/api/eventos');
    const method = editando ? 'PUT' : 'POST';

    try {
      setLoading(true);

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ titulo, fecha, tipo, importante }),
      });

      if (!res.ok) {
        throw new Error(await getResponseMessage(res, 'Error al guardar'));
      }

      setMensaje(editando ? 'Evento actualizado' : 'Evento creado');
      setModalOpen(false);
      await cargarEventos();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Error al guardar'));
    } finally {
      setLoading(false);
    }
  };

  const eliminarEvento = async () => {
    const token = getStoredToken();

    if (!token) {
      setError('No estas logueado');
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/eventos/${eventoId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error(await getResponseMessage(res, 'Error al eliminar'));
      }

      setMensaje('Evento eliminado');
      setModalOpen(false);
      await cargarEventos();
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Error al eliminar'));
    }
  };

  const recordatoriosDestacados = getImportantReminders(eventosInternos);

  const renderEventContent = (eventContent: EventContentArg) => {
    const eventData = eventContent.event.extendedProps as Partial<Evento> & {
      tipo?: EventoTipo | 'Feriado';
    };
    const eventType = eventData.tipo ?? 'Legal';
    const isImportant = Boolean(eventData.importante);

    return (
      <div
        className={`calendar-event ${
          isImportant ? 'calendar-event-important' : ''
        }`}
        style={{
          backgroundColor:
            eventContent.event.backgroundColor || getColor(eventType),
        }}
      >
        <div className="calendar-event-meta">
          <span>{eventType}</span>
          {isImportant && <span className="calendar-event-badge">Recordar</span>}
        </div>
        <div className="calendar-event-title">{eventContent.event.title}</div>
      </div>
    );
  };

  return (
    <main className="page-shell">
      <section className="hero-surface border-b border-[var(--border-color)]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
              Agenda legal
            </p>

            <h1 className="mb-4 text-4xl font-bold tracking-wide md:text-5xl">
              Calendario legal y recordatorios del sitio
            </h1>

            <div className="accent-divider mb-5"></div>

            <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
              Organiza fechas juridicas, hitos economicos y eventos clave en un
              solo espacio. Los eventos marcados como importantes tambien se
              muestran como recordatorios en el inicio.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {[
                { label: 'Legal', color: '#c8a96a' },
                { label: 'Economico', color: '#1f9d69' },
                { label: 'Otro', color: '#7a5d35' },
                { label: 'Feriado CR', color: '#dc2626' },
              ].map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--text-secondary)]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  {item.label}
                </span>
              ))}
            </div>

            {authState.isAdmin && (
              <div className="mt-7">
                <button
                  type="button"
                  onClick={abrirNuevo}
                  className="primary-button"
                >
                  Agregar evento
                </button>
              </div>
            )}
          </div>

          <div className="panel-surface rounded-[2rem] p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
              Vista ejecutiva
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="soft-surface rounded-2xl p-4">
                <p className="text-sm text-[var(--text-tertiary)]">Internos</p>
                <p className="mt-2 text-3xl font-bold">{eventosInternos.length}</p>
              </div>

              <div className="soft-surface rounded-2xl p-4">
                <p className="text-sm text-[var(--text-tertiary)]">
                  Recordatorios
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {eventosInternos.filter((evento) => evento.importante).length}
                </p>
              </div>

              <div className="soft-surface rounded-2xl p-4">
                <p className="text-sm text-[var(--text-tertiary)]">Feriados</p>
                <p className="mt-2 text-3xl font-bold">{cantidadFeriados}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-[var(--border-color)] bg-[var(--surface-strong)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Recordatorio destacado</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Se refleja tambien en la portada
                  </p>
                </div>
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
                  Activo
                </span>
              </div>

              {recordatoriosDestacados.length > 0 ? (
                <div className="mt-4">
                  <p className="text-lg font-semibold">
                    {recordatoriosDestacados[0].titulo}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {formatEventDate(recordatoriosDestacados[0].fecha)} ·{' '}
                    {recordatoriosDestacados[0].tipo}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Todavia no hay eventos marcados como importantes.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {mensaje && (
          <div className="mb-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-strong)] px-5 py-4 text-center text-sm font-medium status-success">
            {mensaje}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-[var(--border-color)] bg-[var(--surface-strong)] px-5 py-4 text-center text-sm font-medium status-error">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <div className="panel-surface rounded-[2rem] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
                Recordatorios
              </p>

              <div className="mt-5 space-y-3">
                {recordatoriosDestacados.length > 0 ? (
                  recordatoriosDestacados.map((evento) => (
                    <div
                      key={evento._id}
                      className="soft-surface rounded-2xl p-4"
                    >
                      <p className="text-sm font-semibold">{evento.titulo}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        {formatEventDate(evento.fecha)}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--accent)]">
                        {evento.tipo}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="soft-surface rounded-2xl p-4 text-sm text-[var(--text-secondary)]">
                    Cuando el administrador marque un evento como importante,
                    aparecera aqui y en inicio.
                  </div>
                )}
              </div>
            </div>
          </aside>

          <div className="calendar-shell glass-surface rounded-[2rem] p-3 md:p-6">
            <FullCalendar
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={eventosCalendario}
              eventClick={handleEventClick}
              eventContent={renderEventContent}
              locale={esLocale}
              height="auto"
              fixedWeekCount={false}
              dayMaxEventRows={isCompactCalendar ? 2 : 3}
            />
          </div>
        </div>
      </section>

      {modalOpen && authState.isAdmin && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="panel-surface max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
                {editando ? 'Editar evento' : 'Nuevo evento'}
              </p>
              <h2 className="mt-3 text-2xl font-semibold">
                {editando
                  ? 'Actualiza la informacion del evento'
                  : 'Programa un nuevo evento'}
              </h2>
            </div>

            <form onSubmit={guardarEvento} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Titulo del evento
                </label>
                <input
                  className="input-field"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Ej. Vencimiento de reforma"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Fecha</label>
                  <input
                    type="date"
                    className="input-field date-field"
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Tipo</label>
                  <select
                    className="select-field"
                    value={tipo}
                    onChange={(event) => setTipo(event.target.value as EventoTipo)}
                  >
                    <option value="Legal">Legal</option>
                    <option value="Economico">Economico</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <label className="soft-surface flex items-start gap-4 rounded-2xl p-4">
                <input
                  type="checkbox"
                  checked={importante}
                  onChange={(event) => setImportante(event.target.checked)}
                  className="mt-1 h-5 w-5 accent-[var(--accent)]"
                />

                <span>
                  <span className="block font-medium">
                    Mostrar tambien como recordatorio en inicio
                  </span>
                  <span className="mt-1 block text-sm text-[var(--text-secondary)]">
                    Utiliza esta opcion para destacar fechas que el usuario deba
                    tener presentes apenas entre al sitio.
                  </span>
                </span>
              </label>

              <div className="grid gap-3 pt-2 md:grid-cols-2">
                <button type="submit" className="primary-button w-full">
                  {loading ? 'Guardando...' : 'Guardar evento'}
                </button>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="neutral-button w-full"
                >
                  Cancelar
                </button>
              </div>
            </form>

            {editando && (
              <button
                type="button"
                onClick={() => void eliminarEvento()}
                className="danger-button mt-3 w-full"
              >
                Eliminar evento
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
