'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useState } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';

export default function RestablecerContrasenna() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') ?? '');
  }, []);

  const resetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('El enlace no tiene token de recuperacion.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudo actualizar la contrasena')
        );
      }

      setMessage(
        await getResponseMessage(res, 'Contrasena actualizada correctamente')
      );
      setPassword('');
      setConfirmPassword('');
    } catch (requestError) {
      setError(
        getErrorMessage(requestError, 'No se pudo actualizar la contrasena')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex items-center justify-center px-6 py-16">
      <div className="panel-surface w-full max-w-md rounded-[2rem] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-wide">
            Nueva contrasena
          </h1>

          <div className="mx-auto my-3 accent-divider"></div>

          <p className="text-sm text-[var(--text-secondary)]">
            Define una nueva contrasena para tu cuenta.
          </p>
        </div>

        {message && (
          <div className="mb-4 text-center text-sm status-success">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 text-center text-sm status-error">{error}</div>
        )}

        {!message ? (
          <form onSubmit={resetPassword} className="space-y-4">
            <input
              type="password"
              placeholder="Nueva contrasena"
              className="input-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Confirmar contrasena"
              className="input-field"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="primary-button w-full disabled:opacity-60"
            >
              {loading ? 'Actualizando...' : 'Actualizar contrasena'}
            </button>
          </form>
        ) : (
          <Link href="/login" className="primary-button w-full">
            Ir a iniciar sesion
          </Link>
        )}
      </div>
    </main>
  );
}
