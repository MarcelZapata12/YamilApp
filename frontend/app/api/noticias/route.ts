import { NextResponse } from 'next/server';

type Noticia = {
  title: string;
  description: string;
  url: string;
  image?: string | null;
};

type ProviderResponse = {
  articles?: Noticia[];
  errors?: string[] | Record<string, string>;
};

const NEWS_API_KEY =
  process.env.GNEWS_API_KEY ?? process.env.NEXT_PUBLIC_NEWS_API;
const COSTA_RICA_TIME_ZONE = 'America/Costa_Rica';
const COSTA_RICA_UTC_OFFSET_HOURS = 6;
const DAILY_REFRESH_HOUR_CR = 6;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const STALE_WHILE_REVALIDATE_SECONDS = 60 * 60;
const NEWS_QUERY = 'Costa Rica derecho legal justicia tribunal ley abogado';

let noticiasCache: {
  articles: Noticia[];
  fetchedAt: number;
  refreshKey: string;
  nextRefreshAt: number;
} | null = null;

let inFlightRequest: {
  refreshKey: string;
  promise: Promise<Noticia[]>;
} | null = null;

function hasCachedArticles() {
  return Boolean(noticiasCache?.articles.length);
}

function getCostaRicaDateParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: COSTA_RICA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  ) as Record<'year' | 'month' | 'day' | 'hour', number>;
}

function getCostaRicaRefreshUtcMs(
  year: number,
  month: number,
  day: number
) {
  return Date.UTC(
    year,
    month - 1,
    day,
    DAILY_REFRESH_HOUR_CR + COSTA_RICA_UTC_OFFSET_HOURS
  );
}

function formatDateKeyFromUtcMs(value: number) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getDailyRefreshWindow(now = new Date()) {
  const { year, month, day, hour } = getCostaRicaDateParts(now);
  const todayRefreshAt = getCostaRicaRefreshUtcMs(year, month, day);
  const refreshAt =
    hour < DAILY_REFRESH_HOUR_CR
      ? todayRefreshAt - ONE_DAY_MS
      : todayRefreshAt;

  return {
    refreshKey: formatDateKeyFromUtcMs(refreshAt),
    nextRefreshAt: refreshAt + ONE_DAY_MS,
  };
}

function getCacheControlHeader(nextRefreshAt: number) {
  const secondsUntilNextRefresh = Math.max(
    60,
    Math.ceil((nextRefreshAt - Date.now()) / 1000)
  );

  return `public, s-maxage=${secondsUntilNextRefresh}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`;
}

function buildNewsResponse(
  payload: Record<string, unknown>,
  nextRefreshAt: number
) {
  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': getCacheControlHeader(nextRefreshAt),
    },
  });
}

function getProviderErrorMessage(data: ProviderResponse | null) {
  if (Array.isArray(data?.errors)) {
    return data.errors[0];
  }

  if (data?.errors && typeof data.errors === 'object') {
    return Object.values(data.errors)[0];
  }

  return null;
}

function getPublicErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    /too many requests|blocked because|429/i.test(error.message)
  ) {
    return 'El proveedor de noticias esta temporalmente limitado. Intenta de nuevo en unos minutos.';
  }

  if (error instanceof Error && /request limit|quota|403/i.test(error.message)) {
    return 'La cuota diaria de noticias se agoto. Intenta nuevamente manana.';
  }

  if (error instanceof Error && /api key|unauthorized|401/i.test(error.message)) {
    return 'La clave de la API de noticias no es valida o no esta activa.';
  }

  return 'No se pudieron cargar las noticias en este momento.';
}

async function fetchProviderNews() {
  const searchParams = new URLSearchParams({
    q: NEWS_QUERY,
    lang: 'es',
    country: 'cr',
    max: '10',
    apikey: NEWS_API_KEY ?? '',
  });

  const response = await fetch(
    `https://gnews.io/api/v4/search?${searchParams.toString()}`,
    { cache: 'no-store' }
  );

  const data = (await response.json().catch(() => null)) as ProviderResponse | null;

  if (!response.ok) {
    throw new Error(
      getProviderErrorMessage(data) ??
        `GNews respondio con estado ${response.status}`
    );
  }

  return data?.articles ?? [];
}

export async function GET() {
  if (!NEWS_API_KEY) {
    return NextResponse.json(
      { error: 'Falta configurar la API de noticias' },
      { status: 500 }
    );
  }

  const { refreshKey, nextRefreshAt } = getDailyRefreshWindow();

  if (noticiasCache?.refreshKey === refreshKey) {
    return buildNewsResponse(
      {
        articles: noticiasCache.articles,
        cached: true,
        fetchedAt: noticiasCache.fetchedAt,
        nextRefreshAt,
        refreshHour: DAILY_REFRESH_HOUR_CR,
      },
      nextRefreshAt
    );
  }

  const currentRequest =
    inFlightRequest?.refreshKey === refreshKey
      ? inFlightRequest.promise
      : fetchProviderNews();

  if (inFlightRequest?.refreshKey !== refreshKey) {
    inFlightRequest = {
      refreshKey,
      promise: currentRequest,
    };
  }

  try {
    const articles = await currentRequest;

    noticiasCache = {
      articles,
      fetchedAt: Date.now(),
      refreshKey,
      nextRefreshAt,
    };

    return buildNewsResponse(
      {
        articles,
        cached: false,
        fetchedAt: noticiasCache.fetchedAt,
        nextRefreshAt,
        refreshHour: DAILY_REFRESH_HOUR_CR,
      },
      nextRefreshAt
    );
  } catch (error) {
    if (hasCachedArticles() && noticiasCache) {
      return buildNewsResponse(
        {
          articles: noticiasCache.articles,
          cached: true,
          stale: true,
          fetchedAt: noticiasCache.fetchedAt,
          nextRefreshAt: noticiasCache.nextRefreshAt,
          refreshHour: DAILY_REFRESH_HOUR_CR,
          warning:
            'Mostrando noticias guardadas porque el proveedor limito temporalmente las solicitudes.',
        },
        noticiasCache.nextRefreshAt
      );
    }

    return NextResponse.json(
      {
        error: getPublicErrorMessage(error),
      },
      { status: 429 }
    );
  } finally {
    if (inFlightRequest?.promise === currentRequest) {
      inFlightRequest = null;
    }
  }
}
