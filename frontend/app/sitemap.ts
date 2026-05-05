import type { MetadataRoute } from 'next';

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

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === '' || route === '/inicio' ? 'weekly' : 'monthly',
    priority: route === '' || route === '/inicio' ? 1 : 0.7,
  }));
}
