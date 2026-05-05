'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';

export default function VerificarCorreo() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState('Verificando tu correo...');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
      setStatus('error');
      setMessage('El enlace no tiene token de verificacion.');
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(
          apiUrl(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
          { cache: 'no-store' }
        );

        if (!res.ok) {
          throw new Error(
            await getResponseMessage(res, 'No se pudo verificar el correo')
          );
        }

        setStatus('success');
        setMessage(
          await getResponseMessage(res, 'Correo verificado correctamente')
        );
      } catch (requestError) {
        setStatus('error');
        setMessage(
          getErrorMessage(requestError, 'No se pudo verificar el correo')
        );
      }
    };

    void verifyEmail();
  }, []);

  return (
    <main className="page-shell flex items-center justify-center px-6 py-16">
      <div className="panel-surface w-full max-w-md rounded-[2rem] p-8 text-center">
        <h1 className="text-2xl font-bold tracking-wide">
          Verificacion de correo
        </h1>
        <div className="mx-auto my-3 accent-divider"></div>
        <p
          className={`text-sm ${
            status === 'error' ? 'status-error' : 'status-success'
          }`}
        >
          {message}
        </p>

        {status !== 'loading' && (
          <Link href="/login" className="primary-button mt-6 w-full">
            Ir a iniciar sesion
          </Link>
        )}
      </div>
    </main>
  );
}
