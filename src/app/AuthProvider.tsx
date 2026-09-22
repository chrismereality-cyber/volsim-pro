'use client';

import React, { useEffect, useState } from 'react';

import {
  getCurrentIdentity,
  getAccessToken,
} from '../auth/client';

import { useIdentityStore } from '../store/useIdentityStore';

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setIdentity = useIdentityStore((state) => state.setIdentity);
  const clearIdentity = useIdentityStore((state) => state.clearIdentity);

  const [hydrating, setHydrating] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function hydrateIdentity() {
      try {
        if (!getAccessToken()) {
          if (!cancelled) {
            clearIdentity();
          }
          return;
        }

        const identity = await getCurrentIdentity();

        if (cancelled) {
          return;
        }

        setIdentity({
          userId: identity.user_id,
          username: identity.username,
          roles: identity.roles.filter(
            (role): role is
              | 'user'
              | 'trader'
              | 'admin'
              | 'superadmin' =>
              ['user', 'trader', 'admin', 'superadmin'].includes(role)
          ),
          permissions: identity.permissions,
          isActive: identity.is_active,
          authenticated: identity.is_active,
        });
      } catch {
        if (!cancelled) {
          clearIdentity();
        }
      } finally {
        if (!cancelled) {
          setHydrating(false);
        }
      }
    }

    void hydrateIdentity();

    return () => {
      cancelled = true;
    };
  }, [clearIdentity, setIdentity]);

  if (hydrating) {
    return null;
  }

  return <>{children}</>;
}
