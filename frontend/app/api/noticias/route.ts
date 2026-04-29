import { NextRequest, NextResponse } from 'next/server';

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
const CACHE_TTL_MS = 15 * 60 * 1000;
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

let noticiasCache: {
  articles: Noticia[];
  fetchedAt: number;
} | null = null;

let inFlightRequest: Promise<Noticia[]> | null = null;

function hasCachedArticles() {
  return Boolean(noticiasCache?.articles.length);
}

function isCacheFresh(now: number) {
  return Boolean(
    noticiasCache && now - noticiasCache.fetchedAt < CACHE_TTL_MS
  );
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
    return 'El proveedor de noticias está temporalmente limitado. Intenta de nuevo en unos minutos.';
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
  const response = await fetch(
    `https://gnews.io/api/v4/search?q=Costa%20Rica&lang=es&max=10&apikey=${NEWS_API_KEY}`,
    { cache: 'no-store' }
  );

  const data = (await response.json().catch(() => null)) as ProviderResponse | null;

  if (!response.ok) {
    throw new Error(
      getProviderErrorMessage(data) ?? `GNews respondio con estado ${response.status}`
    );
  }

  return data?.articles ?? [];
}

export async function GET(request: NextRequest) {
  if (!NEWS_API_KEY) {
    return NextResponse.json(
      { error: 'Falta configurar la API de noticias' },
      { status: 500 }
    );
  }

  const now = Date.now();
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1';

  if (!forceRefresh && isCacheFresh(now) && noticiasCache) {
    return NextResponse.json({
      articles: noticiasCache.articles,
      cached: true,
      fetchedAt: noticiasCache.fetchedAt,
    });
  }

  if (
    forceRefresh &&
    noticiasCache &&
    now - noticiasCache.fetchedAt < REFRESH_COOLDOWN_MS
  ) {
    return NextResponse.json({
      articles: noticiasCache.articles,
      cached: true,
      fetchedAt: noticiasCache.fetchedAt,
      warning:
        'Se muestran noticias recientes para evitar el límite del proveedor.',
    });
  }

  const currentRequest = inFlightRequest ?? fetchProviderNews();
  inFlightRequest = currentRequest;

  try {
    const articles = await currentRequest;

    noticiasCache = {
      articles,
      fetchedAt: Date.now(),
    };

    return NextResponse.json({
      articles,
      cached: false,
      fetchedAt: noticiasCache.fetchedAt,
    });
  } catch (error) {
    if (hasCachedArticles() && noticiasCache) {
      return NextResponse.json({
        articles: noticiasCache.articles,
        cached: true,
        stale: true,
        fetchedAt: noticiasCache.fetchedAt,
        warning:
          'Mostrando noticias guardadas porque el proveedor limitó temporalmente las solicitudes.',
      });
    }

    return NextResponse.json(
      {
        error: getPublicErrorMessage(error),
      },
      { status: 429 }
    );
  } finally {
    if (inFlightRequest === currentRequest) {
      inFlightRequest = null;
    }
  }
}
