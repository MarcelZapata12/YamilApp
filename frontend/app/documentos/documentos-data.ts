import { apiUrl } from '../api-client';

import { getDocumentoPath } from './documentos-url';

export type DocumentoSeo = {
  _id: string;
  titulo: string;
  descripcion?: string;
  archivo?: string;
  tipoArchivo?: string;
  fecha?: string;
};

export const documentosRevalidateSeconds = 3600;

export async function fetchDocumentosSeo() {
  const response = await fetch(apiUrl('/api/articulos'), {
    next: { revalidate: documentosRevalidateSeconds },
  });

  if (!response.ok) {
    throw new Error('No se pudieron cargar los documentos');
  }

  return (await response.json()) as DocumentoSeo[];
}

export async function fetchDocumentoSeo(id: string) {
  const documentos = await fetchDocumentosSeo();

  return documentos.find((documento) => documento._id === id) ?? null;
}

export function getDocumentoDescription(documento: DocumentoSeo) {
  return (
    documento.descripcion?.trim() ||
    `Ficha informativa del documento jurídico "${documento.titulo}" disponible en Derecho y Sociedad.`
  );
}

export function getDocumentoCanonicalUrl(siteUrl: string, documento: DocumentoSeo) {
  return `${siteUrl}${getDocumentoPath(documento)}`;
}
