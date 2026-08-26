'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Ticket,
  ArrowLeft,
  Info,
  Clock,
  Users,
  Star,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface GuestStar {
  name: string;
  photo_url: string;
  role: string;
}

interface TicketTierInfo {
  id: string;
  name: string;
  description: string;
  price: number;
  quota: number;
  sold: number;
  color: string;
  sort_order: number;
  available?: number;
}

interface EventDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  venue_name: string;
  venue_layout_info?: string;
  venue_map_url?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  banner_url: string;
  poster_url?: string;
  guest_stars?: GuestStar[];
  terms_conditions?: string;
  price_min?: number;
  price_max?: number;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAppStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tiers, setTiers] = useState<TicketTierInfo[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evtRes, tierRes, sessRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/tiers`),
        api.get(`/events/${eventId}/sessions`),
      ]);
      if (evtRes.data.success) setEvent(evtRes.data.data);
      if (tierRes.data.success) setTiers(tierRes.data.data);
      if (sessRes.data.success) setSessions(sessRes.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = () => {
    if (!user) {
      router.push('/register');
      return;
    }
    router.push(`/event/${eventId}/queue`);
  };

  const formatCurrency = (amount: number) => `Rp ${amount.toLocaleString('id-ID')}`;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-zinc-400 text-sm animate-pulse">
        Memuat detail event...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-zinc-500 text-sm">
        Event tidak ditemukan.
      </div>
    );
  }

  const minPrice = tiers.length > 0 ? Math.min(...tiers.map((t) => t.price)) : event.price_min || 0;
  const maxPrice = tiers.length > 0 ? Math.max(...tiers.map((t) => t.price)) : event.price_max || 0;
  const totalAvailable = tiers.reduce((sum, t) => sum + ((t.available !== undefined ? t.available : t.quota - t.sold)), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Back Button */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Katalog
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl">
        <img
          src={event.poster_url || event.banner_url}
          alt={event.name}
          className="w-full h-72 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-600 text-white uppercase tracking-widest mb-3">
            {event.category}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white drop-shadow-lg leading-tight">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Event Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Tentang Event</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
          </div>

          {/* Guest Stars */}
          {event.guest_stars && event.guest_stars.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Bintang Tamu & Lineup</h2>
                  <p className="text-xs text-slate-500">Artis dan performer yang akan tampil</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {event.guest_stars.map((star, idx) => (
                  <div key={idx} className="text-center space-y-2 group">
                    <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-slate-200 group-hover:border-indigo-400 transition-all shadow-sm">
                      <img
                        src={star.photo_url}
                        alt={star.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 line-clamp-1">{star.name}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{star.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Day Sessions */}
          {sessions.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Jadwal & Lineup</h2>
                  <p className="text-xs text-slate-500">Jadwal acara per hari</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sessions.map((sess, idx) => (
                  <div
                    key={sess.id}
                    className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 hover:border-indigo-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                        Sesi {sess.sort_order || idx + 1}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        {sess.start_time} - {sess.end_time} WIB
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-slate-900">{sess.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {sess.date}
                    </p>
                    {sess.description && (
                      <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/60 leading-relaxed">
                        {sess.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Venue Map */}
          {event.venue_map_url && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Lokasi Venue</h2>
                  <p className="text-xs text-slate-500">{event.venue_name} — {event.location}</p>
                </div>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 h-64 md:h-80">
                <iframe
                  src={event.venue_map_url}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Venue Location"
                />
              </div>
            </div>
          )}

          {/* Venue Layout Info */}
          {event.venue_layout_info && (
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-white">Tata Letak Venue</h2>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{event.venue_layout_info}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          {event.terms_conditions && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">Syarat & Ketentuan</h2>
                </div>
                {showTerms ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {showTerms && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-sm text-slate-600 leading-relaxed">{event.terms_conditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Event Info & Ticket Pricing */}
        <div className="space-y-6">
          {/* Date & Time */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Waktu & Tempat</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Tanggal & Waktu</span>
                  <span className="text-xs font-bold text-slate-800">
                    {new Date(event.start_date).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </span>
                  {event.end_date && event.end_date !== event.start_date && (
                    <span className="block text-xs text-slate-500 mt-0.5">
                      s/d {new Date(event.end_date).toLocaleString('id-ID', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Lokasi</span>
                  <span className="text-xs font-bold text-slate-800">{event.venue_name}</span>
                  <span className="block text-xs text-slate-500">{event.location}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Ketersediaan</span>
                  <span className="text-xs font-bold text-slate-800">{totalAvailable.toLocaleString('id-ID')} tiket tersisa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Tiers (Read-only Info) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Jenis Tiket</h3>
            </div>
            <div className="space-y-3">
              {tiers.map((tier) => {
                const available = tier.available !== undefined ? tier.available : tier.quota - tier.sold;
                const isSoldOut = available <= 0;
                return (
                  <div
                    key={tier.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isSoldOut
                        ? 'border-slate-200 bg-slate-50 opacity-60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 border-2 border-white shadow-xs"
                          style={{ backgroundColor: tier.color }}
                        />
                        <span className="text-xs font-bold text-slate-900">{tier.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSoldOut
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSoldOut ? 'Habis' : `${available} tersisa`}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-[10px] text-slate-500 mb-1.5 line-clamp-2">{tier.description}</p>
                    )}
                    <span className="text-sm font-black text-indigo-700">
                      {formatCurrency(tier.price)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Harga Tiket</span>
            <span className="text-lg font-black text-indigo-600">
              {minPrice === maxPrice
                ? formatCurrency(minPrice)
                : `${formatCurrency(minPrice)} — ${formatCurrency(maxPrice)}`}
            </span>
          </div>
          <button
            onClick={handleBuyClick}
            disabled={totalAvailable <= 0}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Ticket className="w-4 h-4" />
            {totalAvailable <= 0 ? 'Sold Out' : 'Beli Tiket'}
          </button>
        </div>
      </div>
    </div>
  );
}
