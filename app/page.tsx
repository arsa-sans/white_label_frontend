'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, Ticket, ShieldCheck, Zap, ArrowRight, Building2, Users, Calendar, Lock, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '@/lib/api';

interface EventItem {
  id: string;
  name: string;
  category: string;
  location: string;
  start_date: string;
  banner_url: string;
  price_min: number;
}

export default function LandingPage() {
  const [featuredEvents, setFeaturedEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    api.get('/events?limit=3')
      .then((res) => {
        if (res.data.success) {
          setFeaturedEvents(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-900 text-white pt-20 pb-28">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-indigo-500/30 via-purple-500/20 to-cyan-500/30 blur-3xl pointer-events-none rounded-full" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-cyan-300 shadow-xl">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            White-Label Dynamic Event Platform &amp; Access Control
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Solusi E-Ticketing &amp; Gate Control <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">Kelas Dunia</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
            Platform ticketing multi-tenant terdistribusi dengan QR code rotasi dinamis anti-bot, peta kursi real-time seat lock, dan manajemen gate staff otomatis untuk organizer event.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/events"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Ticket className="w-5 h-5" />
              Cari &amp; Beli Tiket
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register?role=organizer"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-extrabold text-sm backdrop-blur-md flex items-center justify-center gap-2 transition-all hover:scale-105"
            >
              <Building2 className="w-5 h-5 text-cyan-300" />
              Daftar Sebagai Organizer
            </Link>
          </div>

          {/* Key Metrics Trust Banner */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-slate-800">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">Sub-500ms</div>
              <div className="text-xs font-medium text-slate-400">Gate Scan Latency</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-indigo-400">100% Valid</div>
              <div className="text-xs font-medium text-slate-400">Anti QR Duplication</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-cyan-400">Multi-Role</div>
              <div className="text-xs font-medium text-slate-400">Visitor, Staff, Organizer</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-purple-400">Real-Time</div>
              <div className="text-xs font-medium text-slate-400">Distributed Seat Lock</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-black text-slate-900">Fitur Unggulan Platform</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto">
            Didesain khusus untuk menangani ribuan pengujung event secara bersamaan dengan keandalan tanpa henti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Distributed Seat Lock</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Peta kursi interaktif real-time dengan penguncian sementara 10 menit untuk mencegah pemesanan ganda pada kelas VIP dan Regular.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Dynamic QR Rotasi 30 Detik</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tiket digital menggunakan enkripsi AES-256 dengan QR code yang berganti tiap 30 detik untuk mencegah screenshots &amp; tiket tiruan.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xs hover:shadow-xl transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Gate Access &amp; Staff Invite</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Organizer dapat menugaskan Gate Staff melalui dashboard web. Mobile app khusus scanner gate untuk validasi sekejap.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Events Highlights */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Event Pilihan Terbaru</h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">Tiket resmi tersedia langsung di platform kami</p>
            </div>
            <Link
              href="/events"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Lihat Semua Event <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredEvents.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredEvents.map((evt) => (
                <div key={evt.id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs hover:shadow-lg transition-all flex flex-col justify-between">
                  <div className="relative h-44 w-full">
                    <img src={evt.banner_url} alt={evt.name} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-900/80 text-cyan-300 font-extrabold text-[10px] uppercase backdrop-blur-md">
                      {evt.category}
                    </span>
                  </div>
                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 line-clamp-1">{evt.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {new Date(evt.start_date).toLocaleDateString('id-ID')} &bull; {evt.location}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="font-black text-indigo-600 text-sm">Rp {evt.price_min.toLocaleString('id-ID')}</span>
                      <Link
                        href={`/event/${evt.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
                      >
                        Beli Tiket
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Role Dual Call-to-Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Visitor Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-xl">
            <div className="space-y-2 z-10 relative">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Khusus Penonton / Visitor</span>
              <h3 className="text-2xl font-black">Beli Tiket &amp; Nikmati Event</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Pilih tempat duduk favorit Anda di peta interaktif, lakukan pembayaran langsung via e-wallet terintegrasi, dan simpan tiket digital anti-bot di akun Anda.
              </p>
            </div>
            <Link
              href="/register?role=visitor"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white shadow-lg transition-all"
            >
              Daftar Sebagai Visitor <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Organizer Card */}
          <div className="bg-gradient-to-br from-purple-900 to-slate-900 text-white p-8 rounded-3xl space-y-6 relative overflow-hidden shadow-xl">
            <div className="space-y-2 z-10 relative">
              <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-widest">Khusus Penyelenggara Event</span>
              <h3 className="text-2xl font-black">Kelola Festival &amp; Staff Gate</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">
                Buat event baru, atur denah kategori kursi VIP/Regular, pantau grafik okupansi real-time, dan daftarkan tim Gate Staff untuk mobile scanning app.
              </p>
            </div>
            <Link
              href="/register?role=organizer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs text-white shadow-lg transition-all"
            >
              Daftar Sebagai Organizer <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
