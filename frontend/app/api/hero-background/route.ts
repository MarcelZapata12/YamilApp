import { apiUrl } from '../../api-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const upstreamResponse = await fetch(
    apiUrl('/api/configuracion-sitio/portada/imagen'),
    {
      cache: 'no-store',
    }
  );

  const responseHeaders = new Headers();
  responseHeaders.set(
    'Content-Type',
    upstreamResponse.headers.get('content-type') ?? 'application/octet-stream'
  );
  responseHeaders.set('Cache-Control', 'no-store');

  return new Response(await upstreamResponse.arrayBuffer(), {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
