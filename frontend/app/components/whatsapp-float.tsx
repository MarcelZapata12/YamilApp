'use client';

import { usePathname } from 'next/navigation';

const WHATSAPP_URL =
  'https://wa.me/50687042194?text=Hola,%20me%20gustaria%20recibir%20asesoria%20legal.';

export default function WhatsAppFloat() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/register' || pathname === '/admin') {
    return null;
  }

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      title="Contactar por WhatsApp"
      className="fixed bottom-4 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(0,0,0,0.28)] md:bottom-6 md:right-6 md:h-16 md:w-16"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="h-7 w-7 md:h-8 md:w-8"
        fill="currentColor"
      >
        <path d="M19.11 17.14c-.28-.14-1.63-.8-1.88-.89-.25-.09-.43-.14-.62.14-.18.28-.71.89-.87 1.08-.16.18-.32.21-.59.07-.28-.14-1.17-.43-2.22-1.37-.82-.73-1.38-1.64-1.54-1.92-.16-.28-.02-.43.12-.57.13-.13.28-.32.41-.48.14-.16.18-.28.28-.46.09-.18.04-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.53-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.28-.96.93-.96 2.26 0 1.33.98 2.62 1.12 2.8.14.18 1.92 2.93 4.65 4.11.65.28 1.16.45 1.56.57.66.21 1.26.18 1.74.11.53-.08 1.63-.66 1.86-1.3.23-.64.23-1.19.16-1.3-.07-.11-.25-.18-.53-.32Z" />
        <path d="M16.01 3.2c-7.07 0-12.8 5.72-12.8 12.78 0 2.26.59 4.47 1.7 6.42L3.1 28.8l6.57-1.72a12.78 12.78 0 0 0 6.34 1.72h.01c7.06 0 12.79-5.73 12.79-12.79 0-3.42-1.33-6.64-3.76-9.06A12.7 12.7 0 0 0 16.01 3.2Zm0 23.35h-.01a10.6 10.6 0 0 1-5.39-1.47l-.39-.23-3.9 1.02 1.04-3.8-.25-.39a10.58 10.58 0 0 1 8.9-16.25c2.83 0 5.49 1.1 7.49 3.1a10.5 10.5 0 0 1 3.1 7.48c0 5.84-4.75 10.59-10.59 10.59Z" />
      </svg>
    </a>
  );
}
