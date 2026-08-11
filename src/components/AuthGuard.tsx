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
  const { user, token } = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Direct access rules
    if (pathname.startsWith('/dashboard')) {
      if (!token || (user && user.role !== 'organizer' && user.role !== 'admin')) {
        router.replace('/events');
      }
    }

    if (pathname.startsWith('/my-tickets') || pathname.startsWith('/payment-methods')) {
      if (!token) {
        router.replace('/events');
      }
    }
  }, [pathname, user, token, router, mounted]);

  return <>{children}</>;
}
