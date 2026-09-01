'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGoogleLogin } from '@react-oauth/google';
import {
  Ticket,
  Wallet,
  LayoutDashboard,
  LogOut,
  Sparkles,
  Tag,
  Shield,
  AlertTriangle,
  Menu,
  X,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';
import { segmentConfirmTemplates } from '@/lib/confirmPresets';

function GoogleSignInButton({
  onSuccess,
  label,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
}: {
  onSuccess: (tokenResponse: any) => void;
  label: string;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const login = useGoogleLogin({
    onSuccess,
    onError: (err) => {
      console.warn('Google login error or popup closed:', err);
    },
    flow: 'implicit',
  });

  const base = 'flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 tactile-btn';
  const styles =
    variant === 'primary'
      ? `${base} bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs ${fullWidth ? 'w-full' : ''}`
      : `${base} border border-zinc-200 text-zinc-800 hover:bg-zinc-100 ${fullWidth ? 'w-full' : ''}`;

  return (
    <button
      onClick={() => login()}
      disabled={disabled}
      className={styles}
    >
      <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
      {label}
    </button>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const { user, setUser, logout, setHydrated } = useAppStore();
  const confirm = useConfirm();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        .catch(() => logout())
        .finally(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, [setUser, logout, setHydrated]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', {
        access_token: tokenResponse.access_token,
      });
      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutClick = async () => {
    const isConfirmed = await segmentConfirmTemplates.logout(confirm, user?.name);
    if (isConfirmed) {
      logout();
      setMobileMenuOpen(false);
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

    if (user?.role === 'organizer') {
      links.push({ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
      links.push({ href: '/dashboard/promos', label: 'Kode Promo', icon: Tag });
      links.push({ href: '/dashboard/refunds', label: 'Refund & Reschedule', icon: AlertTriangle });
    }

    if (user?.role === 'admin') {
      links.push({ href: '/admin', label: 'Super Admin', icon: Shield });
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-black text-sm shadow-xs">
              WL
            </div>
            <div>
              <span className="font-extrabold text-base text-zinc-950 block leading-tight tracking-tight">
                Soundwave
              </span>
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">
                White Label Event
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? 'bg-zinc-900 text-white shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Auth Controls */}
          <div className="hidden md:flex items-center gap-2">
            {mounted && user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-zinc-900">{user.name}</span>
                  <span className="text-[10px] px-2 py-0.2 rounded-md bg-zinc-100 text-zinc-700 font-mono font-medium capitalize border border-zinc-200">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 text-zinc-700 hover:bg-zinc-100 transition-colors tactile-btn"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3 py-1.5 text-xs font-bold text-zinc-700 hover:text-zinc-950 transition-colors"
                >
                  Masuk
                </Link>

                <Link
                  href="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all tactile-btn"
                >
                  Daftar
                </Link>

                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  label="Google"
                  variant="outline"
                  disabled={loading}
                />
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl border border-zinc-200 text-zinc-800 hover:bg-zinc-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-zinc-200 bg-white shadow-xl animate-in slide-in-from-top duration-200">
            <div className="px-4 py-4 space-y-3">
              {/* Navigation Links */}
              <div className="space-y-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? 'bg-zinc-900 text-white'
                          : 'text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile User / Auth Section */}
              <div className="pt-3 border-t border-zinc-200">
                {mounted && user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center text-xs font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-zinc-900 line-clamp-1">{user.name}</div>
                          <div className="text-[10px] text-zinc-500">{user.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-zinc-800 border border-zinc-200 font-mono capitalize">
                        {user.role}
                      </span>
                    </div>

                    <button
                      onClick={handleLogoutClick}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Keluar dari Akun
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href="/login"
                        className="py-2.5 text-center text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
                      >
                        Masuk
                      </Link>
                      <Link
                        href="/register"
                        className="py-2.5 text-center text-xs font-bold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors"
                      >
                        Daftar
                      </Link>
                    </div>

                    <GoogleSignInButton
                      onSuccess={handleGoogleSuccess}
                      label="Masuk dengan Google"
                      variant="outline"
                      disabled={loading}
                      fullWidth
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
