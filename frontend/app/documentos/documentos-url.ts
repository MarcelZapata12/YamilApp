export type DocumentoUrlData = {
  _id: string;
  titulo: string;
};

export function slugifyDocumento(value: string) {
  const slug = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'documento';
}

export function getDocumentoPath(documento: DocumentoUrlData) {
  return `/documentos/${documento._id}/${slugifyDocumento(documento.titulo)}`;
}
