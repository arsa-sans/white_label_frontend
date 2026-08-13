'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, ShieldCheck, Ticket, Users } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

function RegisterPageContent() {
  const router = useRouter();
  const { setUser } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const googleEmail = prompt('Masukkan Email Akun Google Anda:', 'user@gmail.com');
      if (!googleEmail) {
        setLoading(false);
        return;
      }
      const googleName = prompt(
        'Masukkan Nama Lengkap Anda:',
        googleEmail.split('@')[0].replace(/[._]/g, ' ')
      );
      if (!googleName) {
        setLoading(false);
        return;
      }

      const res = await api.post('/auth/google', {
        email: googleEmail,
        name: googleName,
        google_id: `google-oauth-${Date.now()}`,
      });

      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
        setSuccessMsg(`Berhasil masuk sebagai ${res.data.data.user.name}! Mengarahkan ke katalog event...`);
        setTimeout(() => router.push('/events'), 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login Google gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header card */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-slate-900">Masuk ke Platform</h1>
          <p className="text-sm text-slate-500 font-medium">
            Gunakan akun Google Anda untuk masuk atau mendaftar
          </p>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
          {/* Feature list */}
          <div className="space-y-3">
            {[
              { icon: Ticket, label: 'Beli tiket & pilih kursi secara real-time' },
              { icon: ShieldCheck, label: 'QR Tiket dinamis dengan keamanan enkripsi' },
              { icon: Users, label: 'Akun baru otomatis terdaftar sebagai Visitor' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-sm text-slate-600">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-indigo-600" />
                </div>
                <span className="font-medium">{label}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100" />

          {/* Error / Success */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {successMsg}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 px-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 font-bold text-sm text-slate-800 flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            {loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}
          </button>

          <p className="text-center text-[11px] text-slate-400 font-medium">
            Dengan masuk, Anda menyetujui syarat & kebijakan privasi platform ini
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
