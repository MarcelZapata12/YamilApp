'use client';

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

      setMessage('Cuenta creada correctamente');
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 700);
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
            Los nuevos registros se crean como usuario.
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
            placeholder="Correo electrónico"
            className="input-field"
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            className="input-field"
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
      </div>
    </main>
  );
}
