const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000'
).replace(/\/$/, '');

type ApiMessage = {
  error?: string;
  msg?: string;
  message?: string;
};

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function getResponseMessage(
  response: Response,
  fallback: string
) {
  const data = (await response
    .clone()
    .json()
    .catch(() => null)) as ApiMessage | null;

  return data?.error ?? data?.msg ?? data?.message ?? fallback;
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error inesperado'
) {
  return error instanceof Error ? error.message : fallback;
}
