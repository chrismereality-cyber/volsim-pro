'use client';

import React from 'react';
import { useAuth } from '../auth/AuthProvider';
import { LoginScreen } from '../auth/LoginScreen';

export default function AuthGate({
    children,
}: {
    children: React.ReactNode;
}) {
    const {
        isAuthenticated,
        isLoading,
    } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen w-full bg-[#02040A]" />
        );
    }

    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    return <>{children}</>;
}
