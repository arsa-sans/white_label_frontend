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
      <div className="bg-white border border-zinc-200 text-zinc-950 rounded-2xl p-2.5 shadow-2xs">
        <span className="text-xl font-black block font-mono">{String(timeLeft.days).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-zinc-400">Hari</span>
      </div>
      <div className="bg-white border border-zinc-200 text-zinc-950 rounded-2xl p-2.5 shadow-2xs">
        <span className="text-xl font-black block font-mono">{String(timeLeft.hours).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-zinc-400">Jam</span>
      </div>
      <div className="bg-white border border-zinc-200 text-zinc-950 rounded-2xl p-2.5 shadow-2xs">
        <span className="text-xl font-black block font-mono">{String(timeLeft.minutes).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-zinc-400">Menit</span>
      </div>
      <div className="bg-zinc-900 text-white rounded-2xl p-2.5 shadow-2xs">
        <span className="text-xl font-black block font-mono animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}</span>
        <span className="text-[9px] uppercase font-bold text-zinc-400">Detik</span>
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32 w-full max-w-full overflow-x-hidden">
      {/* Back Button */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-all tactile-btn"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Kembali ke Katalog
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-xs border border-zinc-200 bg-zinc-100">
        <img
          src={event.poster_url || event.banner_url}
          alt={event.name}
          className="w-full h-64 sm:h-80 md:h-96 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <span className="inline-block px-3 py-1 rounded-md text-[10px] font-bold bg-white text-zinc-950 uppercase tracking-wider mb-2.5 shadow-xs">
            {event.category}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white leading-tight">
            {event.name}
          </h1>
        </div>
      </div>

      {/* Sale Countdown Banner if Sale is Upcoming */}
      {saleStatus === 'upcoming' && event.sale_start_at && (
        <div className="bg-white border border-zinc-200 text-zinc-950 rounded-3xl p-6 sm:p-8 shadow-xs text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-800">
            <Timer className="w-4 h-4 animate-spin text-zinc-900" />
            Penjualan Tiket Akan Segera Dibuka
          </div>
          <h2 className="text-base sm:text-xl font-black text-zinc-950">
            Penjualan tiket dibuka pada{' '}
            {new Date(event.sale_start_at).toLocaleDateString('id-ID', {
              dateStyle: 'full',
            })}{' '}
            pukul {new Date(event.sale_start_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </h2>
          <CountdownTimer targetDate={event.sale_start_at} onComplete={() => setSaleStatus('open')} />
          <p className="text-xs text-zinc-500 font-medium max-w-md mx-auto">
            Pastikan Anda sudah login akun Visitor agar siap masuk antrian saat penjualan dibuka.
          </p>
        </div>
      )}

      {/* Sale Closed Banner */}
      {saleStatus === 'closed' && (
        <div className="bg-white border border-zinc-200 rounded-3xl p-6 shadow-xs text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-red-600 font-bold text-sm">
            <Lock className="w-4 h-4" />
            Penjualan Tiket Telah Ditutup
          </div>
          <p className="text-xs text-zinc-500">Periode penjualan tiket event ini sudah berakhir.</p>
        </div>
      )}

      {/* Event Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-xs space-y-3">
            <h2 className="text-lg font-bold text-zinc-950">Tentang Event</h2>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          {/* Guest Stars */}
          {event.guest_stars && event.guest_stars.length > 0 && (
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-950">Bintang Tamu &amp; Lineup</h2>
                  <p className="text-xs text-zinc-500">Artis dan performer yang akan tampil</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {event.guest_stars.map((star, idx) => (
                  <div key={idx} className="text-center space-y-2 group">
                    <div className="relative w-20 h-20 mx-auto rounded-2xl overflow-hidden border-2 border-zinc-200 group-hover:border-zinc-900 transition-all shadow-2xs">
                      <img
                        src={star.photo_url}
                        alt={star.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-950 line-clamp-1">{star.name}</p>
                      <p className="text-[10px] text-zinc-500 font-medium">{star.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Day Sessions */}
          {sessions.length > 0 && (
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-zinc-950">Jadwal &amp; Sesi Acara</h2>
                  <p className="text-xs text-zinc-500">Jadwal rundown per sesi</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sessions.map((sess, idx) => (
                  <div
                    key={sess.id}
                    className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200/80 hover:border-zinc-300 transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-zinc-200 text-zinc-800 font-mono">
                        Sesi {sess.sort_order || idx + 1}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-bold text-zinc-700 font-mono">
                        <Clock className="w-3.5 h-3.5 text-zinc-500" />
                        {sess.start_time} - {sess.end_time} WIB
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold text-zinc-950">{sess.name}</h3>
                    <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      {sess.date}
                    </p>
                    {sess.description && (
                      <p className="text-xs text-zinc-600 pt-1 border-t border-zinc-200/60 leading-relaxed">
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
              <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-zinc-950">Peta &amp; Lokasi Venue</h2>
                      <p className="text-xs text-zinc-500">{event.venue_name} — {event.location}</p>
                    </div>
                  </div>

                  <a
                    href={directMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-xs font-bold transition border border-zinc-200 self-start sm:self-auto tactile-btn"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Buka Google Maps &rarr;
                  </a>
                </div>
                <div className="rounded-2xl overflow-hidden border border-zinc-200 h-64 md:h-80 bg-zinc-100 relative shadow-2xs">
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
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 md:p-8 space-y-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900">
                  <Info className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-zinc-950">Tata Letak Venue</h2>
              </div>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">{event.venue_layout_info}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          {event.terms_conditions && (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-xs overflow-hidden">
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-zinc-950">Syarat &amp; Ketentuan</h2>
                </div>
                {showTerms ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </button>
              {showTerms && (
                <div className="px-6 pb-6 pt-0">
                  <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{event.terms_conditions}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Event Info & Ticket Pricing */}
        <div className="space-y-6">
          {/* Date & Time */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-zinc-950">Waktu &amp; Tempat</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 mt-0.5">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase">Tanggal &amp; Waktu Event</span>
                  <span className="text-xs font-bold text-zinc-900">
                    {new Date(event.start_date).toLocaleString('id-ID', {
                      dateStyle: 'full',
                      timeStyle: 'short',
                    })}
                  </span>
                  {event.end_date && event.end_date !== event.start_date && (
                    <span className="block text-xs text-zinc-500 mt-0.5">
                      s/d {new Date(event.end_date).toLocaleString('id-ID', {
                        dateStyle: 'full',
                        timeStyle: 'short',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase">Lokasi</span>
                  <span className="text-xs font-bold text-zinc-900">{event.venue_name}</span>
                  <span className="block text-xs text-zinc-500">{event.location}</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase">Ketersediaan</span>
                  <span className="text-xs font-bold text-zinc-900 font-mono tabular-nums">{totalAvailable.toLocaleString('id-ID')} tiket tersisa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Tiers */}
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-zinc-900" />
              <h3 className="text-base font-bold text-zinc-950">Jenis Tiket</h3>
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
                        ? 'border-zinc-200 bg-zinc-50 opacity-60'
                        : 'border-zinc-200 bg-white hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-zinc-300"
                          style={{ backgroundColor: tier.color || '#18181B' }}
                        />
                        <span className="text-xs font-bold text-zinc-950">{tier.name}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                          isSoldOut
                            ? 'bg-zinc-200 text-zinc-600'
                            : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
                        }`}
                      >
                        {isSoldOut ? 'Habis' : `${available} tersisa`}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-[10px] text-zinc-500 mb-1.5 line-clamp-2">{tier.description}</p>
                    )}
                    <span className="text-sm font-black text-zinc-950 font-mono tabular-nums">
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
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-zinc-200 shadow-xl py-3.5 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="block text-[10px] uppercase font-bold text-zinc-400">Harga Tiket</span>
            <span className="text-base sm:text-lg font-black text-zinc-950 font-mono tabular-nums">
              {minPrice === maxPrice
                ? formatCurrency(minPrice)
                : `${formatCurrency(minPrice)} — ${formatCurrency(maxPrice)}`}
            </span>
          </div>
          <button
            onClick={handleBuyClick}
            disabled={totalAvailable <= 0 || saleStatus === 'upcoming' || saleStatus === 'closed'}
            className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl text-xs sm:text-sm font-extrabold bg-zinc-900 text-white hover:bg-zinc-800 shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed tactile-btn shrink-0"
          >
            {saleStatus === 'upcoming' ? (
              <>
                <Timer className="w-4 h-4 animate-spin" />
                <span>Menunggu Pembukaan</span>
              </>
            ) : saleStatus === 'closed' ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Penjualan Ditutup</span>
              </>
            ) : totalAvailable <= 0 ? (
              'Sold Out'
            ) : (
              <>
                <Ticket className="w-4 h-4" />
                <span>Beli Tiket</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
