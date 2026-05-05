import './globals.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';

import Navbar from './components/navbar';
import WhatsAppFloat from './components/whatsapp-float';

const siteUrl = 'https://yamilchacon.com';
const siteTitle = 'Bradly Yamil Chacon Murillo | Derecho y Sociedad';
const siteDescription =
  'Asesoria en tecnica legislativa, calidad normativa, proyectos de ley, capacitacion parlamentaria, docencia universitaria y analisis de politicas publicas en Costa Rica.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  applicationName: 'Derecho y Sociedad',
  authors: [{ name: 'Bradly Yamil Chacon Murillo' }],
  creator: 'Bradly Yamil Chacon Murillo',
  publisher: 'Derecho y Sociedad',
  keywords: [
    'abogado Costa Rica',
    'asesoria legal Costa Rica',
    'tecnica legislativa',
    'calidad normativa',
    'proyectos de ley',
    'capacitacion parlamentaria',
    'derecho agrario',
    'recurso hidrico',
    'derecho ambiental',
    'politicas publicas',
    'fortalecimiento institucional',
    'docencia universitaria',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_CR',
    url: siteUrl,
    siteName: 'Derecho y Sociedad',
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: '/logoNuevo.png',
        width: 1200,
        height: 630,
        alt: 'Derecho y Sociedad',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/logoNuevo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const legalServiceStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  '@id': `${siteUrl}/#legalservice`,
  name: 'Bradly Yamil Chacon Murillo - Derecho y Sociedad',
  alternateName: 'Derecho y Sociedad',
  url: siteUrl,
  logo: `${siteUrl}/logoNuevo.png`,
  image: `${siteUrl}/perfil.jpeg`,
  email: 'derechoysociedad.cr@gmail.com',
  telephone: '+50687042194',
  areaServed: {
    '@type': 'Country',
    name: 'Costa Rica',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'CR',
    addressRegion: 'Costa Rica',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+50687042194',
    contactType: 'customer service',
    availableLanguage: 'Spanish',
    url: 'https://wa.me/50687042194',
  },
  sameAs: ['https://wa.me/50687042194'],
  serviceType: [
    'Asesoria en tecnica legislativa y calidad normativa',
    'Docencia universitaria',
    'Elaboracion y revision de proyectos de ley',
    'Capacitacion parlamentaria',
    'Capacitacion en materia agraria, recurso hidrico y ambiente',
    'Analisis de politicas publicas en seguridad',
    'Fortalecimiento institucional',
  ],
};

const themeScript = `
  try {
    const savedTheme = window.localStorage.getItem('theme-mode');
    const resolvedTheme = savedTheme === 'dark' ? 'dark' : 'light';
    document.documentElement.dataset.theme = resolvedTheme;
  } catch {
    document.documentElement.dataset.theme = 'light';
  }
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="light" suppressHydrationWarning>
      <body className="antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(legalServiceStructuredData),
          }}
        />
        <Navbar />
        <main>{children}</main>
        <WhatsAppFloat />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
