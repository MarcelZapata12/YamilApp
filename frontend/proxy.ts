import { NextResponse, type NextRequest } from 'next/server';

const CANONICAL_HOST = 'yamilchacon.com';
const ALLOWED_HOSTS = new Set(['yamilchacon.com', 'www.yamilchacon.com']);

function isLocalhost(host: string) {
  return host.startsWith('localhost:') || host.startsWith('127.0.0.1:');
}

export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() ?? '';

  if (!host || ALLOWED_HOSTS.has(host) || isLocalhost(host)) {
    return NextResponse.next();
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.protocol = 'https';
  redirectUrl.host = CANONICAL_HOST;

  return NextResponse.redirect(redirectUrl, 308);
}

export const config = {
  matcher: '/:path*',
};
