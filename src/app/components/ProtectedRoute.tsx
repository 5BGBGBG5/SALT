"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // This effect runs once on the client after the component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // This effect handles the redirection logic
  useEffect(() => {
    // We wait until the component has mounted (isClient) AND
    // the auth state is no longer loading before we check for a user.
    if (isClient && !loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router, isClient]);

  // While loading the auth state or before the client has mounted,
  // we show a full-page loader. This prevents any flash of protected content.
  if (loading || !isClient || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Only if all checks pass, render the protected content.
  return <>{children}</>;
}