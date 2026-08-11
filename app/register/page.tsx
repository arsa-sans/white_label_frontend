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
  
  // Organizer specific verification fields
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

    if (activeTab === 'organizer' && !eventName) {
      setErrorMsg('Registrasi Organizer wajib memasukkan Nama Event sebagai verifikasi');
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        name,
        email,
        password,
        role: activeTab,
      };

      if (activeTab === 'organizer') {
        payload.event_name = eventName;
        payload.event_date = eventDate;
        payload.event_location = eventLocation;
      }

      const res = await api.post('/auth/register', payload);

      if (res.data.success) {
        setUser(res.data.data.user, res.data.data.token);
        setSuccessMsg(
          activeTab === 'organizer'
            ? 'Akun Organizer berhasil terverifikasi! Mengarahkan ke Dashboard...'
            : 'Pendaftaran Visitor berhasil! Mengarahkan ke Katalog Event...'
        );

        setTimeout(() => {
          if (activeTab === 'organizer') {
            router.push('/dashboard');
          } else {
            router.push('/events');
          }
        }, 1200);
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
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="budi@gmail.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
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
              <div className="flex items-center gap-2 text-xs font-bold text-purple-900">
                <Shield className="w-4 h-4 text-purple-600" />
                Bukti Verifikasi Penyelenggara Event
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
              ? 'Daftar Akun Organizer'
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
