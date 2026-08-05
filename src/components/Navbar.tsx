'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Ticket, Wallet, QrCode, LayoutDashboard, LogIn, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';
import { segmentConfirmTemplates } from '@/lib/confirmPresets';

export default function Navbar() {
  const pathname = usePathname();
  const { user, setUser, logout } = useAppStore();
  const confirm = useConfirm();
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
      setErrorMsg(err.response?.data?.message || 'Login gagal. Periksa kembali email dan password.');
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

  const navLinks = [
    { href: '/', label: 'Catalog', icon: Sparkles },
    { href: '/my-tickets', label: 'My Tickets', icon: Ticket },
    { href: '/wallet', label: 'Cashless Wallet', icon: Wallet },
    { href: '/gate-scan', label: 'Gate Scan', icon: QrCode },
    { href: '/dashboard', label: 'Organizer', icon: LayoutDashboard },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Tenant Logo & Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
              WL
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 block leading-tight">
                Soundwave Festival
              </span>
              <span className="text-[10px] uppercase tracking-widest font-bold text-indigo-600">
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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
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
            {user ? (
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
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
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
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-indigo-600" />
                Sign In to Platform
              </h2>
              <button
                onClick={() => setIsAuthOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-colors"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <span className="block text-[11px] font-bold text-slate-500 mb-2 uppercase tracking-wider">
                Quick Demo Logins (One-Click):
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleLogin(undefined, 'budi@gmail.com', 'password123')}
                  className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-[11px] font-bold text-indigo-700 transition-colors"
                >
                  👤 Visitor
                </button>
                <button
                  onClick={() => handleLogin(undefined, 'gate@soundwave.com', 'password123')}
                  className="p-2.5 rounded-xl border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-[11px] font-bold text-cyan-700 transition-colors"
                >
                  📱 Gate Staff
                </button>
                <button
                  onClick={() => handleLogin(undefined, 'organizer@soundwave.com', 'password123')}
                  className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-[11px] font-bold text-purple-700 transition-colors"
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
