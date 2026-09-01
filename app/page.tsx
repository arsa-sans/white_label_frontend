'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  ShieldCheck,
  Zap,
  ArrowRight,
  Building2,
  Users,
  Calendar,
  Lock,
  ChevronRight,
  QrCode,
  CheckCircle2,
  Activity,
  Layers,
} from 'lucide-react';
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
    <div className="space-y-16 sm:space-y-24 pb-20 w-full max-w-full overflow-x-hidden">
      {/* ─── Hero Section (Bento Grid Architecture) ────────────────────── */}
      <section className="pt-8 sm:pt-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 lg:p-14 shadow-xs relative overflow-hidden">
          {/* Subtle Grid Accent */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f4f4f5_1px,transparent_1px),linear-gradient(to_bottom,#f4f4f5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none opacity-60" />

          <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800">
              <span className="w-2 h-2 rounded-full bg-zinc-900 animate-pulse" />
              White-Label Event Platform &bull; Multi-Tenant Ecosystem
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-zinc-950 leading-[1.12]">
              Sistem E-Ticketing &amp; Gate Control <span className="underline decoration-zinc-300 underline-offset-8">Terdistribusi</span>
            </h1>

            {/* Subtitle */}
            <p className="text-zinc-600 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto font-normal leading-relaxed">
              Infrastruktur tiket digital multi-tenant dengan rotasi QR dinamis anti-bot, penguncian kursi real-time, dan manajemen gate scanner cepat untuk festival dan konser.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                href="/events"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 tactile-btn"
              >
                <Ticket className="w-4 h-4" />
                Cari &amp; Beli Tiket
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register?role=organizer"
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 font-bold text-xs flex items-center justify-center gap-2 tactile-btn shadow-2xs"
              >
                <Building2 className="w-4 h-4 text-zinc-600" />
                Daftar Sebagai Organizer
              </Link>
            </div>

            {/* Bento Metrics Banner */}
            <div className="pt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-zinc-100">
              <div className="p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100">
                <div className="text-xl sm:text-2xl font-black text-zinc-950 font-mono">&lt;500ms</div>
                <div className="text-[11px] font-semibold text-zinc-500 mt-0.5">Gate Scan Latency</div>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100">
                <div className="text-xl sm:text-2xl font-black text-zinc-950 font-mono">100%</div>
                <div className="text-[11px] font-semibold text-zinc-500 mt-0.5">Anti QR Duplication</div>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100">
                <div className="text-xl sm:text-2xl font-black text-zinc-950 font-mono">30s</div>
                <div className="text-[11px] font-semibold text-zinc-500 mt-0.5">Dynamic QR Rotation</div>
              </div>
              <div className="p-3 rounded-2xl bg-zinc-50/80 border border-zinc-100">
                <div className="text-xl sm:text-2xl font-black text-zinc-950 font-mono">Real-Time</div>
                <div className="text-[11px] font-semibold text-zinc-500 mt-0.5">Seat Lock Engine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Bento Feature Matrix ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 w-full">
        <div className="text-center space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 font-mono">
            Keunggulan Arsitektur
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
            Fondasi Keandalan Skala Konser
          </h2>
          <p className="text-zinc-500 text-xs sm:text-sm max-w-xl mx-auto">
            Dirancang secara khusus untuk menangani lonjakan ribuan pembeli tiket serentak tanpa antrean ganda.
          </p>
        </div>

        {/* Bento Grid Layout (Asymmetric 12-Column) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          {/* Bento Item 1: Distributed Seat Lock (Col 1-7) */}
          <div className="md:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-950">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-zinc-950">Distributed Seat Lock Engine</h3>
                <p className="text-xs text-zinc-500 leading-relaxed max-w-lg">
                  Sistem penguncian kursi sementara berbasis Redis terdistribusi selama 10 menit saat checkout. Menjamin tidak ada dua pembeli yang mendapatkan nomor kursi yang sama pada saat *ticket war*.
                </p>
              </div>
            </div>

            {/* Micro Visual Mockup */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-zinc-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Zone A &bull; Row 04 &bull; Seat 12</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-800 font-bold">
                LOCKED (09:42)
              </span>
            </div>
          </div>

          {/* Bento Item 2: Dynamic QR Code (Col 8-12) */}
          <div className="md:col-span-5 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-950">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-bold text-zinc-950">Dynamic Anti-Screenshot QR</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  QR Code e-ticket berotasi setiap 30 detik dengan enkripsi token dinamis. Screenshot statis otomatis tidak berlaku di gate scanner.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-600 animate-spin" />
                <span className="text-xs font-mono font-medium text-zinc-700">Rotasi Tiap 30s</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-950 text-white">
                ANTI-FRAUD
              </span>
            </div>
          </div>

          {/* Bento Item 3: Gate Access Control (Col 1-12) */}
          <div className="md:col-span-12 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-950 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-zinc-950">Gate Access &amp; Mobile Scanner App</h3>
                <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                  Organizer dapat menugaskan staff gate langsung dari web dashboard. Staff menggunakan aplikasi mobile dengan sinkronisasi database lokal offline untuk kecepatan validasi instan di lapangan.
                </p>
              </div>
            </div>

            <Link
              href="/register?role=organizer"
              className="shrink-0 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs flex items-center gap-2 transition-all tactile-btn"
            >
              Mulai Sebagai Organizer <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Featured Events Section ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 w-full">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">Event Pilihan Terbaru</h2>
            <p className="text-xs text-zinc-500 mt-0.5 font-medium">Tiket resmi tersedia langsung melalui sistem kami</p>
          </div>
          <Link
            href="/events"
            className="text-xs font-bold text-zinc-900 hover:text-zinc-600 flex items-center gap-1 transition-colors"
          >
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredEvents.map((evt) => (
              <div
                key={evt.id}
                className="bg-white rounded-3xl overflow-hidden border border-zinc-200 shadow-xs hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[16/9] w-full bg-zinc-100 overflow-hidden">
                  <img
                    src={evt.banner_url}
                    alt={evt.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-zinc-950/85 text-white font-bold text-[10px] uppercase tracking-wider backdrop-blur-sm">
                    {evt.category}
                  </span>
                </div>
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-950 line-clamp-1">{evt.name}</h3>
                    <p className="text-xs text-zinc-500 mt-1.5 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                      <span>{new Date(evt.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; {evt.location}</span>
                    </p>
                  </div>
                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-zinc-400 font-semibold uppercase">Mulai Dari</div>
                      <span className="font-black text-zinc-950 text-sm font-mono tabular-nums">
                        Rp {evt.price_min.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <Link
                      href={`/event/${evt.id}`}
                      className="px-4 py-2 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-colors tactile-btn"
                    >
                      Beli Tiket
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-zinc-200 space-y-3">
            <Ticket className="w-8 h-8 text-zinc-400 mx-auto" />
            <div className="text-sm font-bold text-zinc-800">Belum Ada Event Aktif</div>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Event baru akan segera hadir. Daftarkan diri Anda sebagai organizer untuk mulai menjual tiket konser.
            </p>
          </div>
        )}
      </section>

      {/* ─── Role Dual Call-to-Action ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Visitor Card */}
          <div className="bg-white border border-zinc-200 p-7 sm:p-8 rounded-3xl space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                Khusus Penonton / Visitor
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-950">Beli Tiket &amp; Nikmati Event</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                Pilih tempat duduk favorit di peta interaktif, lakukan pembayaran langsung via QRIS/VA terintegrasi, dan nikmati e-ticket berotasi dinamis.
              </p>
            </div>
            <div>
              <Link
                href="/register?role=visitor"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 font-bold text-xs text-white shadow-xs transition-all tactile-btn"
              >
                Daftar Sebagai Visitor <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Organizer Card */}
          <div className="bg-white border border-zinc-200 p-7 sm:p-8 rounded-3xl space-y-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                Khusus Penyelenggara Event
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-zinc-950">Kelola Festival &amp; Staff Gate</h3>
              <p className="text-xs text-zinc-600 leading-relaxed font-normal">
                Buat event baru, atur layout denah kursi, pantau grafik kedatangan penonton secara real-time, dan daftarkan tim gate scanner mobile.
              </p>
            </div>
            <div>
              <Link
                href="/register?role=organizer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 font-bold text-xs text-zinc-900 transition-all tactile-btn"
              >
                Daftar Sebagai Organizer <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

