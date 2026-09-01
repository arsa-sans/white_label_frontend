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
  Timer,
  Lock,
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
  sale_start_at?: string;
  sale_end_at?: string;
  sale_status?: 'upcoming' | 'open' | 'closed';
  capacity: number;
  banner_url: string;
  poster_url?: string;
  guest_stars?: GuestStar[];
  terms_conditions?: string;
  price_min?: number;
  price_max?: number;
}

function CountdownTimer({ targetDate, onComplete }: { targetDate: string; onComplete?: () => void }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(
    null
  );

  useEffect(() => {
    const calculateTime = () => {
      const difference = new Date(targetDate).getTime() - new Date().getTime();
      if (difference <= 0) {
        setTimeLeft(null);
        if (onComplete) onComplete();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (!timeLeft) {
    return null;
  }

  return (
    <div className="grid grid-cols-4 gap-2 text-center max-w-sm mx-auto">
      <div className="bg-slate-900 text-white rounded-2xl p-2.5 shadow-md">
        <span className="text-xl font-black block">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400">Hari</span>
      </div>
      <div className="bg-slate-900 text-white rounded-2xl p-2.5 shadow-md">
        <span className="text-xl font-black block">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400">Jam</span>
      </div>
      <div className="bg-slate-900 text-white rounded-2xl p-2.5 shadow-md">
        <span className="text-xl font-black block">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-slate-400">Menit</span>
      </div>
      <div className="bg-indigo-600 text-white rounded-2xl p-2.5 shadow-md">
        <span className="text-xl font-black block animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-indigo-200">Detik</span>
      </div>
    </div>
  );
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
  const [saleStatus, setSaleStatus] = useState<'upcoming' | 'open' | 'closed'>('open');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evtRes, tierRes, sessRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/tiers`),
        api.get(`/events/${eventId}/sessions`),
      ]);
      if (evtRes.data.success) {
        const evtData: EventDetail = evtRes.data.data;
        setEvent(evtData);

        // Determine sale status
        const now = new Date();
        if (evtData.sale_start_at && now < new Date(evtData.sale_start_at)) {
          setSaleStatus('upcoming');
        } else if (evtData.sale_end_at && now > new Date(evtData.sale_end_at)) {
          setSaleStatus('closed');
        } else {
          setSaleStatus('open');
        }
      }
      if (tierRes.data.success) setTiers(tierRes.data.data);
      if (sessRes.data.success) setSessions(sessRes.data.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const handleBuyClick = () => {
    if (!user) {
      router.push('/login');
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

      {/* Sale Countdown Banner if Sale is Upcoming */}
      {saleStatus === 'upcoming' && event.sale_start_at && (
        <div className="bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-700 text-white rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/20 text-xs font-extrabold uppercase tracking-wider">
            <Timer className="w-4 h-4 animate-spin text-amber-300" />
            Penjualan Tiket Akan Segera Dibuka
          </div>
          <h2 className="text-lg sm:text-xl font-black">
            Penjualan tiket dibuka pada{' '}
            {new Date(event.sale_start_at).toLocaleDateString('id-ID', {
              dateStyle: 'full',
            })}{' '}
            pukul {new Date(event.sale_start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </h2>
          <CountdownTimer targetDate={event.sale_start_at} onComplete={() => setSaleStatus('open')} />
          <p className="text-xs text-indigo-100 font-medium max-w-md mx-auto">
            Pastikan Anda sudah login akun Visitor agar siap masuk antrian saat penjualan dibuka.
          </p>
        </div>
      )}

      {/* Sale Closed Banner */}
      {saleStatus === 'closed' && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-rose-400 font-bold text-sm">
            <Lock className="w-4 h-4" />
            Penjualan Tiket Telah Ditutup
          </div>
          <p className="text-xs text-slate-400">Periode penjualan tiket event ini sudah berakhir.</p>
        </div>
      )}

      {/* Event Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Tentang Event</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          {/* Guest Stars */}
          {event.guest_stars && event.guest_stars.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Bintang Tamu &amp; Lineup</h2>
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
                  <h2 className="text-lg font-bold text-slate-900">Jadwal &amp; Lineup</h2>
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
          {(event.venue_map_url || event.location) && (() => {
            const rawUrl = (event.venue_map_url || '').trim();
            const locationQuery = event.venue_name ? `${event.venue_name}, ${event.location}` : event.location;
            
            // Build reliable embed URL that always works with a red marker pin
            let embedSrc = `https://maps.google.com/maps?q=${encodeURIComponent(locationQuery)}&t=&z=16&ie=UTF8&iwloc=B&output=embed`;
            
            if (rawUrl) {
              if (rawUrl.includes('output=embed') || rawUrl.includes('google.com/maps/embed')) {
                embedSrc = rawUrl;
              } else if (rawUrl.includes('<iframe') && rawUrl.includes('src=')) {
                const match = rawUrl.match(/src=["']([^"']+)["']/);
                if (match && match[1]) embedSrc = match[1];
              }
            }

            const directMapsLink = rawUrl.startsWith('http')
              ? rawUrl
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationQuery)}`;

            return (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Peta &amp; Lokasi Venue</h2>
                      <p className="text-xs text-slate-500">{event.venue_name} — {event.location}</p>
                    </div>
                  </div>

                  <a
                    href={directMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 text-xs font-bold transition border border-cyan-200 self-start sm:self-auto"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Buka di Google Maps &rarr;
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden border border-slate-200 h-64 md:h-80 bg-slate-100 relative shadow-inner">
                  <iframe
                    src={embedSrc}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Peta Lokasi Event"
                  />
                </div>
              </div>
            );
          })()}

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
                  <h2 className="text-lg font-bold text-slate-900">Syarat &amp; Ketentuan</h2>
                </div>
                {showTerms ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {showTerms && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{event.terms_conditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Event Info & Ticket Pricing */}
        <div className="space-y-6">
          {/* Date & Time */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">Waktu &amp; Tempat</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase">Tanggal &amp; Waktu Event</span>
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
            disabled={totalAvailable <= 0 || saleStatus === 'upcoming' || saleStatus === 'closed'}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saleStatus === 'upcoming' ? (
              <>
                <Timer className="w-4 h-4 animate-spin" />
                Menunggu Penjualan Dibuka
              </>
            ) : saleStatus === 'closed' ? (
              <>
                <Lock className="w-4 h-4" />
                Penjualan Ditutup
              </>
            ) : totalAvailable <= 0 ? (
              'Sold Out'
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                Beli Tiket
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
