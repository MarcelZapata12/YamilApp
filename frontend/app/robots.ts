import type { MetadataRoute } from 'next';

const siteUrl = 'https://yamilchacon.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/login',
        '/register',
        '/verificar-correo',
        '/restablecer-contrasenna',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
