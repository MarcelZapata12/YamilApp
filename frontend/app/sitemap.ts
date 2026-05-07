import type { MetadataRoute } from 'next';

import { fetchDocumentosSeo } from './documentos/documentos-data';
import { getDocumentoPath } from './documentos/documentos-url';

const siteUrl = 'https://yamilchacon.com';

const publicRoutes = [
  '',
  '/inicio',
  '/about',
  '/documentos',
  '/libros',
  '/noticias',
  '/calendario',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const documentos = await fetchDocumentosSeo().catch(() => []);

  return [
    ...publicRoutes.map((route) => {
      const isPrimaryRoute = route === '' || route === '/inicio';

      return {
        url: `${siteUrl}${route}`,
        lastModified,
        changeFrequency: isPrimaryRoute ? ('weekly' as const) : ('monthly' as const),
        priority: isPrimaryRoute ? 1 : 0.7,
      };
    }),
    ...documentos.map((documento) => ({
      url: `${siteUrl}${getDocumentoPath(documento)}`,
      lastModified: documento.fecha ? new Date(documento.fecha) : lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.65,
    })),
  ];
}
