'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Wallet, QrCode, LayoutDashboard, LogIn, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';

export default function Navbar() {
  const pathname = usePathname();
  const { user, setUser, logout } = useAppStore();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Fetch profile on initial load if token exists
    const token = localStorage.getItem('wl_token');
    if (token && !user) {
      api
        .get('/auth/me')
        .then((res) => {
          if (res.data.success) {
            setUser(res.data.data);
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [setUser, logout, user]);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/login', {
        email: customEmail || email,
        password: customPass || password,
      });

      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
        setIsAuthOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const navLinks = [
    { href: '/', label: 'Catalog', icon: Sparkles },
    { href: '/my-tickets', label: 'My Tickets', icon: Ticket },
    { href: '/wallet', label: 'Cashless Wallet', icon: Wallet },
    { href: '/gate-scan', label: 'Gate Scan', icon: QrCode },
    { href: '/dashboard', label: 'Organizer', icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200 dark:bg-zinc-950/90 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Tenant Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              WL
            </div>
            <div>
              <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100 block leading-tight">
                Soundwave Festival
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600 dark:text-indigo-400">
                White Label Ticketing
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800'
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
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{user.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 font-mono capitalize">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Sign In to Platform
              </h2>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="text-zinc-400 hover:text-zinc-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-xs dark:bg-red-950/60 dark:text-red-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@gmail.com"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <span className="block text-[11px] font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                Quick Demo Logins (One-Click):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleLogin(undefined, 'budi@gmail.com', 'password123')}
                  className="p-2 rounded-lg border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 dark:border-indigo-900 dark:bg-indigo-950/40 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300"
                >
                  👤 Visitor
                </button>
                <button
                  onClick={() => handleLogin(undefined, 'gate@soundwave.com', 'password123')}
                  className="p-2 rounded-lg border border-cyan-200 bg-cyan-50/50 hover:bg-cyan-100 dark:border-cyan-900 dark:bg-cyan-950/40 text-[11px] font-semibold text-cyan-700 dark:text-cyan-300"
                >
                  📱 Gate Staff
                </button>
                <button
                  onClick={() => handleLogin(undefined, 'organizer@soundwave.com', 'password123')}
                  className="p-2 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 text-[11px] font-semibold text-purple-700 dark:text-purple-300"
                >
                  👑 Organizer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
