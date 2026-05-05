'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState, useSyncExternalStore } from 'react';

import { apiUrl, getErrorMessage, getResponseMessage } from '../api-client';
import {
  getAuthState,
  getServerAuthState,
  persistAuthSession,
  subscribeToAuth,
} from '../auth-client';

type LoginResponse = {
  token?: string;
  email?: string;
};

export default function Login() {
  const router = useRouter();
  const authState = useSyncExternalStore(
    subscribeToAuth,
    getAuthState,
    getServerAuthState
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  useEffect(() => {
    if (!authState.isLogged) {
      return;
    }

    router.replace(authState.isAdmin ? '/admin' : '/documentos');
  }, [authState.isAdmin, authState.isLogged, router]);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

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
      router.replace('/documentos');
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo iniciar sesion'));
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      setLoading(true);

      const res = await fetch(apiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudo enviar el enlace')
        );
      }

      setMessage(
        await getResponseMessage(
          res,
          'Si el correo existe, recibiras un enlace para restablecer la contrasena.'
        )
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo enviar el enlace'));
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setError('');
    setMessage('');

    try {
      setResendingVerification(true);

      const res = await fetch(apiUrl('/api/auth/resend-verification'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error(
          await getResponseMessage(res, 'No se pudo reenviar el correo')
        );
      }

      setMessage(
        await getResponseMessage(
          res,
          'Si la cuenta esta pendiente, se enviara un nuevo enlace.'
        )
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo reenviar el correo'));
    } finally {
      setResendingVerification(false);
    }
  };

  return (
    <main className="page-shell flex items-center justify-center px-6 py-16">
      <div className="panel-surface w-full max-w-md rounded-[2rem] p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-wide">Acceso al sistema</h1>

          <div className="mx-auto my-3 accent-divider"></div>

          <p className="text-sm text-[var(--text-secondary)]">
            {forgotMode
              ? 'Recuperacion de acceso'
              : 'Plataforma de documentos legales'}
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

        <form
          onSubmit={forgotMode ? requestPasswordReset : login}
          className="space-y-4"
        >
          <input
            type="email"
            placeholder="Correo electronico"
            className="input-field"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          {!forgotMode && (
            <input
              type="password"
              placeholder="Contrasena"
              className="input-field"
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="primary-button w-full disabled:opacity-60"
          >
            {forgotMode
              ? loading
                ? 'Enviando...'
                : 'Enviar enlace de recuperacion'
              : loading
                ? 'Ingresando...'
                : 'Ingresar'}
          </button>
        </form>

        {!forgotMode && error.toLowerCase().includes('verificar') && (
          <button
            type="button"
            onClick={() => void resendVerification()}
            disabled={resendingVerification || !email}
            className="secondary-button mt-4 w-full disabled:opacity-60"
          >
            {resendingVerification
              ? 'Reenviando...'
              : 'Reenviar correo de verificacion'}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setForgotMode((current) => !current);
            setError('');
            setMessage('');
          }}
          className="mt-5 w-full text-center text-sm font-semibold text-[var(--accent)]"
        >
          {forgotMode ? 'Volver a iniciar sesion' : 'Olvide mi contrasena'}
        </button>

        <p className="mt-6 text-center text-xs text-[var(--text-secondary)]">
          Acceso exclusivo para usuarios autorizados
        </p>
      </div>
    </main>
  );
}
