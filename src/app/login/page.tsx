'use client';

import React, { FormEvent, useState } from 'react';

import {
  getCurrentIdentity,
  login,
} from '../../auth/client';

import { useIdentityStore } from '../../store/useIdentityStore';

export default function LoginPage() {
  const setIdentity = useIdentityStore((state) => state.setIdentity);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);

      const identity = await getCurrentIdentity();

      const validRoles = [
        'user',
        'trader',
        'admin',
        'superadmin',
      ] as const;

      setIdentity({
        userId: identity.user_id,
        username: identity.username,
        roles: identity.roles.filter(
          (role): role is (typeof validRoles)[number] =>
            validRoles.includes(
              role as (typeof validRoles)[number]
            )
        ),
        permissions: identity.permissions,
        isActive: identity.is_active,
        authenticated: identity.is_active,
      });

      window.location.href = '/';
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to authenticate.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <section className="w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <p className="text-xs tracking-[0.3em] text-amber-400 font-bold">
              VOLSIM-PRO
            </p>

            <h1 className="text-3xl font-black tracking-wider mt-2">
              NEURAL EXECUTION CORE
            </h1>

            <p className="text-sm text-slate-500 mt-3">
              Secure enterprise trading infrastructure access.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold tracking-wider text-slate-400 mb-2"
              >
                EMAIL
              </label>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-3 text-sm outline-none focus:border-amber-400"
                placeholder="operator@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold tracking-wider text-slate-400 mb-2"
              >
                PASSWORD
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                className="w-full rounded-lg bg-slate-950 border border-slate-800 px-4 py-3 text-sm outline-none focus:border-amber-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-black tracking-wider text-slate-950 transition hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'AUTHENTICATING...'
                : 'AUTHENTICATE'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
