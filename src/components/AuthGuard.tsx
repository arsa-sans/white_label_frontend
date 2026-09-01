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
  const { user, token, rehydrateAuth } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    rehydrateAuth();
    setReady(true);
  }, [rehydrateAuth]);

  useEffect(() => {
    if (!ready) return;

    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null;
    const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('wl_user') : null;
    let storedUser = user;
    if (!storedUser && storedUserStr) {
      try {
        storedUser = JSON.parse(storedUserStr);
      } catch {}
    }

    const currentToken = token || storedToken;
    const currentUser = storedUser;

    // If user is ALREADY logged in and visits /login or /register, auto-redirect by role
    if (currentToken && currentUser && (pathname === '/login' || pathname === '/register')) {
      if (currentUser.role === 'organizer') {
        router.replace('/dashboard');
        return;
      } else if (currentUser.role === 'admin') {
        router.replace('/admin');
        return;
      } else if (currentUser.role === 'gate_staff') {
        router.replace('/gate-scan');
        return;
      } else if (currentUser.role === 'vendor') {
        router.replace('/booth');
        return;
      } else {
        router.replace('/');
        return;
      }
    }

    // Protect organizer dashboard
    if (pathname.startsWith('/dashboard')) {
      if (!currentToken) {
        router.replace('/login');
      } else if (currentUser && currentUser.role !== 'organizer' && currentUser.role !== 'admin') {
        router.replace('/');
      }
    }

    // Protect admin panel
    if (pathname.startsWith('/admin')) {
      if (!currentToken) {
        router.replace('/login');
      } else if (currentUser && currentUser.role !== 'admin') {
        router.replace('/');
      }
    }

    // Protect visitor pages
    if (pathname.startsWith('/my-tickets') || pathname.startsWith('/payment-methods')) {
      if (!currentToken) {
        router.replace('/login');
      }
    }
  }, [pathname, user, token, router, ready]);

  return <>{children}</>;
}

