'use client';

import { type FormEvent, useState } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';
import { persistAuthSession } from '../auth-client';

type LoginResponse = {
  token?: string;
  email?: string;
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    try {
      setLoading(true);

      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudo iniciar sesion')
        );
      }

      const data = (await res.json()) as LoginResponse;

      if (!data.token) {
        throw new Error('Respuesta invalida del servidor');
      }

      persistAuthSession({
        token: data.token,
        email: data.email ?? email,
      });
      window.location.href = '/documentos';
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo iniciar sesion'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page-shell flex items-center justify-center px-6 py-16">
      <div className="panel-surface w-full max-w-md rounded-[2rem] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-wide">Acceso al sistema</h1>

          <div className="mx-auto my-3 accent-divider"></div>

          <p className="text-sm text-[var(--text-secondary)]">
            Plataforma de documentos legales
          </p>
        </div>

        {error && (
          <div className="mb-4 text-center text-sm status-error">{error}</div>
        )}

        <form onSubmit={login} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electronico"
            className="input-field"
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contrasena"
            className="input-field"
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Acceso exclusivo para usuarios autorizados
        </p>
      </div>
    </main>
  );
}
