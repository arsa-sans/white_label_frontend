'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGoogleLogin } from '@react-oauth/google';
import { Sparkles, CheckCircle2, AlertCircle, Loader2, User, Building2, ShieldCheck, Ticket } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

function GoogleSignInButton({
  onSuccess,
  loading,
}: {
  onSuccess: (tokenResponse: any) => void;
  loading: boolean;
}) {
  const login = useGoogleLogin({
    onSuccess,
    onError: () => console.error('Google login failed'),
    flow: 'implicit',
  });

  return (
    <button
      type="button"
      onClick={() => login()}
      disabled={loading}
      className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 font-bold text-xs text-slate-800 flex items-center justify-center gap-2.5 transition-all shadow-xs disabled:opacity-60 disabled:cursor-not-allowed group"
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
      ) : (
        <svg className="w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
      )}
      {loading ? 'Menghubungkan...' : 'Daftar Cepat dengan Google (Visitor)'}
    </button>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const { user, token, setUser } = useAppStore();

  const [roleTab, setRoleTab] = useState<'visitor' | 'organizer'>('visitor');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  React.useEffect(() => {
    const storedToken = typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null;
    const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('wl_user') : null;
    let currentUser = user;
    if (!currentUser && storedUserStr) {
      try {
        currentUser = JSON.parse(storedUserStr);
      } catch {}
    }
    const currentToken = token || storedToken;

    if (currentToken && currentUser) {
      if (currentUser.role === 'organizer') {
        router.replace('/dashboard');
      } else if (currentUser.role === 'admin') {
        router.replace('/admin');
      } else if (currentUser.role === 'gate_staff') {
        router.replace('/gate-scan');
      } else if (currentUser.role === 'vendor') {
        router.replace('/booth');
      } else {
        router.replace('/');
      }
    }
  }, [user, token, router]);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Organizer specific states
  const [nik, setNik] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const handleGoogleSuccess = async (tokenResponse: any) => {
    setGoogleLoading(true);
    setErrorMsg('');

    try {
      const res = await api.post('/auth/google', {
        access_token: tokenResponse.access_token,
      });

      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
        setSuccessMsg(`Selamat datang, ${res.data.data.user.name}! Mengarahkan...`);
        setTimeout(() => router.push('/events'), 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login Google gagal. Silakan gunakan form pendaftaran.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email || !password) {
      setErrorMsg('Nama, email, dan password wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      return;
    }

    if (roleTab === 'organizer') {
      if (!nik || nik.length < 16) {
        setErrorMsg('NIK / No. KTP wajib 16 digit angka.');
        return;
      }
      if (!companyName || !eventName) {
        setErrorMsg('Nama Perusahaan dan Rencana Nama Event wajib diisi.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: any = {
        name,
        email,
        password,
        role: roleTab,
      };

      if (roleTab === 'organizer') {
        payload.nik = nik;
        payload.company_name = companyName;
        payload.event_name = eventName;
        payload.event_location = eventLocation || 'Jakarta';
        payload.event_description = eventDescription;
      }

      const res = await api.post('/auth/register', payload);

      if (res.data.success) {
        if (roleTab === 'visitor') {
          setUser(res.data.data.user, res.data.data.token);
          setSuccessMsg('Pendaftaran berhasil! Mengarahkan ke katalog event...');
          setTimeout(() => router.push('/events'), 1000);
        } else {
          // Organizer pending
          setSuccessMsg(
            'Pendaftaran Organizer berhasil terkirim! Akun Anda sedang menunggu verifikasi dari Admin. Silakan cek berkala atau hubungi admin.'
          );
        }
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Gagal mendaftar. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Buat Akun Baru</h1>
          <p className="text-xs text-slate-500 font-medium">
            Daftar sebagai pembeli tiket (Visitor) atau penyelenggara event (Organizer)
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-5">
          {/* Role Tabs */}
          <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setRoleTab('visitor');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleTab === 'visitor' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Visitor / Pembeli
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleTab('organizer');
                setErrorMsg('');
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                roleTab === 'organizer' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Organizer Event
            </button>
          </div>

          {/* Google OAuth (only for visitor) */}
          {roleTab === 'visitor' && (
            <>
              <GoogleSignInButton onSuccess={handleGoogleSuccess} loading={googleLoading} />
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                  Atau Daftar dengan Email
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>
            </>
          )}

          {/* Error / Success messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={roleTab === 'visitor' ? 'Budi Santoso' : 'Elena Rostova'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Ulangi Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Organizer fields */}
            {roleTab === 'organizer' && (
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  Verifikasi Penyelenggara Event
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK KTP (16 Digit) *</label>
                  <input
                    type="text"
                    maxLength={16}
                    required
                    value={nik}
                    onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                    placeholder="3201xxxxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Perusahaan / Organisasi *</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PT Soundwave Entertainment"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rencana Nama Event Pertama *</label>
                  <input
                    type="text"
                    required
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Neon Genesis Music Festival 2026"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lokasi / Kota</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="JIExpo Kemayoran, Jakarta"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 ${
                roleTab === 'organizer'
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
              }`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? 'Mendaftarkan...'
                : roleTab === 'organizer'
                ? 'Ajukan Pendaftaran Organizer'
                : 'Daftar Sebagai Visitor'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500 font-medium">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="font-bold text-indigo-600 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
