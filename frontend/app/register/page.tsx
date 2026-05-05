'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const register = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);

      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudo crear la cuenta')
        );
      }

      setMessage(
        await getResponseMessage(
          res,
          'Cuenta creada. Revisa tu correo para verificarla antes de iniciar sesion.'
        )
      );
      setPassword('');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo crear la cuenta'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex items-center justify-center px-6 py-16">
      <div className="panel-surface w-full max-w-md rounded-[2rem] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-wide">Crear cuenta</h1>

          <div className="mx-auto my-3 accent-divider"></div>

          <p className="text-sm text-[var(--text-secondary)]">
            Los nuevos registros deben verificar su correo.
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

        <form onSubmit={register} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electronico"
            className="input-field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contrasena"
            className="input-field"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        {message && (
          <Link
            href="/login"
            className="secondary-button mt-4 w-full text-center"
          >
            Ir a iniciar sesion
          </Link>
        )}
      </div>
    </main>
  );
}
