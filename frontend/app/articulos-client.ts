import { apiUrl, getResponseMessage } from './api-client';
import { getStoredToken } from './auth-client';

export type Articulo = {
  _id: string;
  titulo: string;
  descripcion?: string;
  archivo: string;
  tipoArchivo?: string;
  fecha?: string;
};

function getFilename(contentDisposition: string | null) {
  if (!contentDisposition) {
    return 'documento.pdf';
  }

  const match = contentDisposition.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? 'documento.pdf';
}

function triggerBlob(
  blob: Blob,
  filename: string,
  mode: 'open' | 'download'
) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.rel = 'noopener noreferrer';

  if (mode === 'download') {
    link.download = filename;
  } else {
    link.target = '_blank';
  }

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
}

async function fetchProtectedFile(articuloId: string) {
  const token = getStoredToken();

  if (!token) {
    window.location.href = '/login';
    return null;
  }

  const response = await fetch(apiUrl(`/api/articulos/${articuloId}/archivo`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    window.localStorage.removeItem('token');
    window.location.href = '/login';
    return null;
  }

  if (!response.ok) {
    throw new Error(
      await getResponseMessage(response, 'No se pudo obtener el documento')
    );
  }

  return {
    blob: await response.blob(),
    filename: getFilename(response.headers.get('Content-Disposition')),
  };
}

export async function openArticulo(articulo: Pick<Articulo, '_id' | 'titulo'>) {
  const result = await fetchProtectedFile(articulo._id);

  if (!result) {
    return false;
  }

  triggerBlob(result.blob, result.filename || `${articulo.titulo}.pdf`, 'open');
  return true;
}

export async function downloadArticulo(
  articulo: Pick<Articulo, '_id' | 'titulo'>
) {
  const result = await fetchProtectedFile(articulo._id);

  if (!result) {
    return false;
  }

  triggerBlob(
    result.blob,
    result.filename || `${articulo.titulo}.pdf`,
    'download'
  );
  return true;
}
