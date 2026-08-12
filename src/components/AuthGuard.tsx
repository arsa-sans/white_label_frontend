'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, token, isHydrated } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Initialize state from localStorage if store not yet hydrated
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null;
    const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('wl_user') : null;
    let storedUser = null;
    try {
      if (storedUserStr) storedUser = JSON.parse(storedUserStr);
    } catch {}

    const currentUser = user || storedUser;
    const currentToken = token || storedToken;

    if (pathname.startsWith('/dashboard')) {
      if (!currentToken) {
        router.replace('/events');
      } else if (currentUser && currentUser.role !== 'organizer' && currentUser.role !== 'admin') {
        router.replace('/events');
      }
    }

    if (pathname.startsWith('/my-tickets') || pathname.startsWith('/payment-methods')) {
      if (!currentToken) {
        router.replace('/events');
      }
    }
  }, [pathname, user, token, router, mounted]);

  return <>{children}</>;
}

