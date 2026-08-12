'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { User, Building2, Ticket, Sparkles, CheckCircle2, ArrowRight, Shield } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAppStore();

  const initialRole = searchParams.get('role') === 'organizer' ? 'organizer' : 'visitor';
  const [activeTab, setActiveTab] = useState<'visitor' | 'organizer'>(initialRole);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Organizer specific complex verification fields
  const [nik, setNik] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [npwp, setNpwp] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Direct call to Google OAuth API or mock fallback for dev
      const res = await api.post('/auth/google', {
        email: email || 'user.google@whitelabel.id',
        name: name || 'Google User Demo',
        google_id: 'google-oauth-demo-12345',
      });
      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
        setSuccessMsg('Login dengan akun Google berhasil!');
        setTimeout(() => {
          router.push('/events');
        }, 1000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Login Google gagal. Pastikan data Google valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!name || !email || !password) {
      setErrorMsg('Nama, Email, dan Password wajib diisi');
      setLoading(false);
      return;
    }

    if (activeTab === 'organizer') {
      if (!nik || nik.length < 16) {
        setErrorMsg('NIK / Nomor KTP Wajib 16 Digit Angka');
        setLoading(false);
        return;
      }
      if (!companyName) {
        setErrorMsg('Nama Perusahaan / Organisasi Wajib Diisi');
        setLoading(false);
        return;
      }
      if (!eventName) {
        setErrorMsg('Registrasi Organizer wajib memasukkan Nama Event');
        setLoading(false);
        return;
      }
    }

    try {
      const payload: any = {
        name,
        email,
        password,
        role: activeTab,
      };

      if (activeTab === 'organizer') {
        payload.nik = nik;
        payload.company_name = companyName;
        payload.event_name = eventName;
        payload.event_date = eventDate;
        payload.event_location = eventLocation;
        payload.event_description = eventDescription;
        payload.portfolio_url = portfolioUrl;
        payload.npwp = npwp;
      }

      const res = await api.post('/auth/register', payload);

      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
        setSuccessMsg(
          activeTab === 'organizer'
            ? 'Pengajuan Akun Organizer Berhasil! Email verifikasi telah dikirim ke Admin (arsaprayata72@gmail.com) untuk disetujui. Silakan tunggu persetujuan.'
            : 'Pendaftaran Visitor berhasil! Mengarahkan ke Katalog Event...'
        );

        setTimeout(() => {
          if (activeTab === 'organizer') {
            router.push('/events');
          } else {
            router.push('/events');
          }
        }, 2000);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Pendaftaran gagal. Periksa data Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 mx-auto flex items-center justify-center text-indigo-600">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Daftar Akun Baru</h1>
          <p className="text-xs text-slate-500 font-medium">
            Pilih jenis akun sesuai kebutuhan Anda di platform WhiteLabel
          </p>
        </div>

        {/* Google OAuth Quick Button */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 font-bold text-xs text-slate-700 flex items-center justify-center gap-3 transition-all shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            Masuk / Daftar Dengan Akun Google
          </button>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-[10px] uppercase font-bold text-slate-400">Atau Isi Form Manual</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            type="button"
            onClick={() => { setActiveTab('visitor'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'visitor'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" />
            Visitor / Penonton
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('organizer'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'organizer'
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Organizer Event
          </button>
        </div>

        {/* Feedback Alert */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Organizer Event Verification Info */}
          {activeTab === 'organizer' && (
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900 border-b border-purple-200/60 pb-2">
                <Shield className="w-4 h-4 text-purple-600" />
                Persyaratan Verifikasi Resmi Organizer Event
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NIK / No. KTP (16 Digit) *</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    placeholder="3171000000000000"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Perusahaan / EO *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="PT Soundwave Entertainment"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Event Konser / Festival *</label>
                <input
                  type="text"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Contoh: Java Jazz Festival 2026"
                  className="w-full px-3.5 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Event</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Lokasi Event</label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="JIExpo Kemayoran"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Deskripsi / Ringkasan Event Proposal</label>
                <textarea
                  rows={2}
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Jelaskan konsep event, artis yang tampil, dan perkiraan kapasitas penonton..."
                  className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Link Portofolio / Medsos EO</label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://instagram.com/my_event_organizer"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">NPWP Perusahaan (Opsional)</label>
                  <input
                    type="text"
                    value={npwp}
                    onChange={(e) => setNpwp(e.target.value)}
                    placeholder="01.234.567.8-012.000"
                    className="w-full px-3 py-2 rounded-xl border border-purple-200 bg-white text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              <div className="text-[10px] text-purple-700 font-medium bg-purple-100/50 p-2 rounded-lg">
                ℹ Akun Anda akan di-review oleh Admin melalui notifikasi email <strong>arsaprayata72@gmail.com</strong> sebelum akses dashboard diaktifkan.
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 rounded-2xl font-extrabold text-xs text-white shadow-lg transition-all ${
              activeTab === 'organizer'
                ? 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20'
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
            }`}
          >
            {loading
              ? 'Memproses Pendaftaran...'
              : activeTab === 'organizer'
              ? 'Kirim Pengajuan Organizer ke Admin'
              : 'Daftar Akun Visitor'}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-500 font-medium">
          Sudah punya akun?{' '}
          <Link href="/events" className="font-bold text-indigo-600 hover:text-indigo-700">
            Sign In di Navbar
          </Link>
        </div>
      </div>
    </div>
  );
}
