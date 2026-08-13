'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Ticket, Wallet, QrCode, LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';
import { segmentConfirmTemplates } from '@/lib/confirmPresets';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, logout, setHydrated } = useAppStore();
  const confirm = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('wl_token');
    const cachedUser = localStorage.getItem('wl_user');
    if (cachedUser && !user) {
      try {
        setUser(JSON.parse(cachedUser), token || undefined);
      } catch {}
    }

    if (token) {
      api
        .get('/auth/me')
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.data, token);
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setHydrated(true);
        });
    } else {
      setHydrated(true);
    }
  }, [setUser, logout, setHydrated]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const googleEmail = prompt('Masukkan Email Akun Google Anda:', 'user@gmail.com');
      if (!googleEmail) { setLoading(false); return; }
      const googleName = prompt('Masukkan Nama Lengkap Anda:', googleEmail.split('@')[0].replace(/[._]/g, ' '));
      if (!googleName) { setLoading(false); return; }

      const res = await api.post('/auth/google', {
        email: googleEmail,
        name: googleName,
        google_id: `google-oauth-${Date.now()}`,
      });

      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
      }
    } catch {
      // silently fail, user can try again
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    const isConfirmed = await segmentConfirmTemplates.logout(confirm, user?.name);
    if (isConfirmed) {
      logout();
    }
  };

  const getNavLinks = () => {
    const links = [
      { href: '/', label: 'Beranda', icon: Sparkles },
      { href: '/events', label: 'Catalog Event', icon: Ticket },
    ];

    if (!mounted) return links;

    if (user?.role === 'visitor') {
      links.push({ href: '/my-tickets', label: 'My Tickets', icon: Ticket });
      links.push({ href: '/payment-methods', label: 'Metode Pembayaran', icon: Wallet });
    }

    if (user?.role === 'organizer' || user?.role === 'admin') {
      links.push({ href: '/dashboard', label: 'Organizer Dashboard', icon: LayoutDashboard });
    }

    if (user?.role === 'admin') {
      links.push({ href: '/gate-scan', label: 'Gate Scan', icon: QrCode });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              WL
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 block leading-tight">
                Soundwave Festival
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">
                White Label Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Auth Controls */}
          <div className="flex items-center gap-3">
            {mounted && user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-slate-800">{user.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-mono capitalize">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-60"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" fillOpacity="0.9" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" fillOpacity="0.75" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" fillOpacity="0.6" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="currentColor" fillOpacity="0.85" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                )}
                {loading ? 'Menghubungkan...' : 'Sign In dengan Google'}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
