import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  fetchDocumentoSeo,
  fetchDocumentosSeo,
  getDocumentoCanonicalUrl,
  getDocumentoDescription,
} from '../../documentos-data';
import { slugifyDocumento } from '../../documentos-url';

const siteUrl = 'https://yamilchacon.com';

type PageProps = {
  params: Promise<{
    id: string;
    slug?: string[];
  }>;
};

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const documentos = await fetchDocumentosSeo();

    return documentos.map((documento) => ({
      id: documento._id,
      slug: [slugifyDocumento(documento.titulo)],
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const documento = await fetchDocumentoSeo(id);

  if (!documento) {
    return {
      title: 'Documento no encontrado | Derecho y Sociedad',
      robots: { index: false, follow: false },
    };
  }

  const description = getDocumentoDescription(documento);
  const canonicalUrl = getDocumentoCanonicalUrl(siteUrl, documento);

  return {
    title: `${documento.titulo} | Biblioteca jurídica`,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: documento.titulo,
      description,
      siteName: 'Derecho y Sociedad',
    },
  };
}

export default async function DocumentoDetalle({ params }: PageProps) {
  const { id } = await params;
  const documento = await fetchDocumentoSeo(id);

  if (!documento) {
    notFound();
  }

  const description = getDocumentoDescription(documento);
  const canonicalUrl = getDocumentoCanonicalUrl(siteUrl, documento);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'DigitalDocument',
    name: documento.titulo,
    description,
    url: canonicalUrl,
    datePublished: documento.fecha,
    inLanguage: 'es-CR',
    publisher: {
      '@type': 'Organization',
      name: 'Derecho y Sociedad',
      url: siteUrl,
    },
  };

  return (
    <main className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <section className="hero-surface border-b border-[var(--border-color)] py-12 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent)]">
          Biblioteca jurídica
        </p>

        <h1 className="mx-auto mb-3 max-w-4xl text-4xl font-bold tracking-wide md:text-5xl">
          {documento.titulo}
        </h1>

        <div className="mx-auto accent-divider"></div>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[var(--text-secondary)] md:text-base">
          {description}
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="panel-surface rounded-[2rem] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">
            Documento disponible
          </p>

          <h2 className="mt-4 text-2xl font-semibold">
            Consulta protegida para usuarios registrados
          </h2>

          <p className="mt-4 text-sm leading-6 text-[var(--text-secondary)] md:text-base">
            Esta ficha permite ubicar el documento por tema, título o palabras
            relacionadas. Para abrirlo o descargarlo, inicia sesión en la
            biblioteca.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/login" className="primary-button text-sm">
              Iniciar sesión
            </Link>

            <Link href="/documentos" className="secondary-button text-sm">
              Ver biblioteca
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
