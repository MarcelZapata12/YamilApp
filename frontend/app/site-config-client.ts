import { apiUrl } from './api-client';

export type SiteConfig = {
  heroBackgroundImageUrl: string | null;
  heroBackgroundImageUpdatedAt: string | null;
  heroBackgroundImageFit: HeroAssetFit | null;
};

export type HeroAssetFit = 'cover' | 'contain';

export const EMPTY_SITE_CONFIG: SiteConfig = {
  heroBackgroundImageUrl: null,
  heroBackgroundImageUpdatedAt: null,
  heroBackgroundImageFit: null,
};

const SITE_CONFIG_STORAGE_KEY = 'site-config-cache';

let siteConfigCache = EMPTY_SITE_CONFIG;
let siteConfigCacheHydrated = false;

export function normalizeSiteConfig(
  data: Partial<SiteConfig> | null | undefined
): SiteConfig {
  return {
    heroBackgroundImageUrl: data?.heroBackgroundImageUrl ?? null,
    heroBackgroundImageUpdatedAt: data?.heroBackgroundImageUpdatedAt ?? null,
    heroBackgroundImageFit: data?.heroBackgroundImageFit ?? null,
  };
}

function hydrateSiteConfigCache() {
  if (siteConfigCacheHydrated || typeof window === 'undefined') {
    return;
  }

  siteConfigCacheHydrated = true;

  try {
    const stored = window.sessionStorage.getItem(SITE_CONFIG_STORAGE_KEY);

    if (stored) {
      siteConfigCache = normalizeSiteConfig(
        JSON.parse(stored) as Partial<SiteConfig>
      );
    }
  } catch {
    siteConfigCache = EMPTY_SITE_CONFIG;
  }
}

export function getCachedSiteConfig() {
  hydrateSiteConfigCache();
  return siteConfigCache;
}

export function hasCachedSiteConfig() {
  hydrateSiteConfigCache();

  return (
    siteConfigCache.heroBackgroundImageUrl !== null ||
    siteConfigCache.heroBackgroundImageUpdatedAt !== null ||
    siteConfigCache.heroBackgroundImageFit !== null
  );
}

export function cacheSiteConfig(config: SiteConfig) {
  const normalizedConfig = normalizeSiteConfig(config);

  siteConfigCache = normalizedConfig;
  siteConfigCacheHydrated = true;

  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem(
      SITE_CONFIG_STORAGE_KEY,
      JSON.stringify(normalizedConfig)
    );
  }

  return normalizedConfig;
}

export async function fetchSiteConfig() {
  const response = await fetch(apiUrl('/api/configuracion-sitio'), {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('No se pudo cargar la configuración visual del inicio');
  }

  const config = (await response.json()) as SiteConfig;
  return cacheSiteConfig(config);
}

export function resolveSiteAssetUrl(
  assetPath: string | null,
  version?: string | null
) {
  if (!assetPath) {
    return null;
  }

  if (assetPath === '/api/configuracion-sitio/portada/imagen') {
    const proxiedPath = '/api/hero-background';

    return version
      ? `${proxiedPath}?v=${encodeURIComponent(version)}`
      : proxiedPath;
  }

  const absoluteUrl = new URL(apiUrl(assetPath));

  if (version) {
    absoluteUrl.searchParams.set('v', version);
  }

  return absoluteUrl.toString();
}

export function resolveHeroAssetFit(width: number, height: number): HeroAssetFit {
  if (!width || !height) {
    return 'cover';
  }

  return width / height >= 1.45 ? 'cover' : 'contain';
}

export function detectHeroAssetFit(assetUrl: string) {
  if (typeof window === 'undefined') {
    return Promise.resolve<HeroAssetFit>('cover');
  }

  return new Promise<HeroAssetFit>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      resolve(resolveHeroAssetFit(image.naturalWidth, image.naturalHeight));
    };

    image.onerror = () => {
      resolve('cover');
    };

    image.src = assetUrl;
  });
}

export function preloadImageAsset(assetUrl: string) {
  if (typeof window === 'undefined') {
    return Promise.resolve(false);
  }

  return new Promise<boolean>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      resolve(true);
    };

    image.onerror = () => {
      resolve(false);
    };

    image.src = assetUrl;
  });
}
