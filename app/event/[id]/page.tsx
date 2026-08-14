'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Ticket, Plus, Minus, ArrowRight, Info, Layers, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore, TicketTier } from '@/lib/store';
import { useConfirm } from '@/hooks/useConfirm';

interface EventDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  venue_name: string;
  venue_layout_info?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  banner_url: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();
  const confirm = useConfirm();

  const { user, cart, updateCartQuantity, setActiveEventId } = useAppStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setActiveEventId(eventId);
    fetchData();

    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [eventId]);

  const fetchData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [evtRes, tierRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/tiers`),
      ]);

      if (evtRes.data.success) {
        setEvent(evtRes.data.data);
      }
      if (tierRes.data.success) {
        setTiers(tierRes.data.data);
      }
    } catch (err: any) {
      if (!isBackground) {
        setErrorMsg('Gagal memuat detail event dan tier tiket.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const eventCartItems = cart.filter((c) => c.event_id === eventId);
  const totalItemCount = eventCartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = eventCartItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handleQuantityChange = (tier: TicketTier, delta: number) => {
    updateCartQuantity(
      {
        tier_id: tier.id,
        tier_name: tier.name,
        event_id: eventId,
        event_name: event?.name || '',
        unit_price: tier.price,
      },
      delta
    );
  };

  const handleProceedClick = async () => {
    if (!user) {
      await confirm({
        segmentTag: 'AUTENTIKASI & AKUN',
        title: 'Sign In Diperlukan',
        message: 'Anda perlu Sign In terlebih dahulu sebelum melanjutkan ke pembayaran tiket.',
        confirmText: 'Mengerti',
        cancelText: 'Tutup',
        variant: 'warning',
      });
      return;
    }

    if (totalItemCount === 0) {
      setErrorMsg('Pilih minimal 1 tiket sebelum melanjutkan.');
      return;
    }

    router.push('/checkout');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-400 text-sm animate-pulse">
        Memuat detail event &amp; kategori tiket...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-500 text-sm">
        Event tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Event Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-md grid grid-cols-1 lg:grid-cols-3">
        <div className="relative h-64 lg:h-auto lg:col-span-1 bg-slate-100">
          <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent lg:hidden" />
        </div>

        <div className="p-6 lg:p-8 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
              {event.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900">{event.name}</h1>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-normal">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Waktu Event</span>
                <span className="font-bold text-slate-800">
                  {new Date(event.start_date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-slate-400 font-bold uppercase">Lokasi Venue</span>
                <span className="font-bold text-slate-800">{event.venue_name} ({event.location})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} className="font-extrabold text-xs">✕</button>
        </div>
      )}

      {/* Stage Layout Visualization Info */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Tata Letak Penonton &amp; Jarak Panggung</h2>
            <p className="text-xs text-indigo-200">Kategori tiket ditentukan berdasarkan jarak posisi menyaksikan dari panggung utama.</p>
          </div>
        </div>

        {event.venue_layout_info && (
          <div className="p-4 rounded-2xl bg-white/10 border border-white/10 text-xs text-slate-200 leading-relaxed font-medium">
            <Info className="w-4 h-4 text-indigo-400 inline mr-2" />
            {event.venue_layout_info}
          </div>
        )}

        {/* Stage Banner Visual */}
        <div className="w-full max-w-xl mx-auto py-3 bg-gradient-to-r from-indigo-500/30 via-indigo-500/60 to-indigo-500/30 rounded-2xl text-center text-xs font-black tracking-widest text-white uppercase border border-indigo-400/40 shadow-inner">
          ══ PANGGUNG UTAMA / STAGE ARENA ══
        </div>
      </div>

      {/* Ticket Tiers Selection Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-600" />
              Pilih Kategori Tiket
            </h2>
            <p className="text-xs text-slate-500 font-medium">Pilih jumlah tiket pada kategori yang Anda inginkan.</p>
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="space-y-4">
          {tiers.map((tier) => {
            const available = tier.available !== undefined ? tier.available : tier.quota - tier.sold;
            const isSoldOut = available <= 0;
            const cartItem = eventCartItems.find((c) => c.tier_id === tier.id);
            const currentQty = cartItem ? cartItem.quantity : 0;

            return (
              <div
                key={tier.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  currentQty > 0
                    ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-sm'
                    : isSoldOut
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow-xs"
                      style={{ backgroundColor: tier.color }}
                    />
                    <h3 className="font-extrabold text-slate-900 text-base">{tier.name}</h3>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                        isSoldOut
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isSoldOut ? 'Habis (Sold Out)' : `Tersisa ${available} tiket`}
                    </span>
                  </div>

                  {tier.description && (
                    <p className="text-xs text-slate-600 font-normal leading-relaxed">{tier.description}</p>
                  )}

                  <div className="text-base font-black text-indigo-700">
                    Rp {tier.price.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-normal text-slate-400">/ tiket</span>
                  </div>
                </div>

                {/* Quantity Controller */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  {isSoldOut ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-200 px-4 py-2 rounded-xl">
                      Sold Out
                    </span>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                      <button
                        onClick={() => handleQuantityChange(tier, -1)}
                        disabled={currentQty === 0}
                        className="w-8 h-8 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-30 transition-all flex items-center justify-center shadow-xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-8 text-center text-sm font-extrabold text-slate-900 font-mono">
                        {currentQty}
                      </span>

                      <button
                        onClick={() => handleQuantityChange(tier, 1)}
                        disabled={currentQty >= available}
                        className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center justify-center shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/30">
                {totalItemCount}
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-500">Tiket Dipilih</span>
                <div className="flex flex-wrap gap-1">
                  {eventCartItems.map((item) => (
                    <span key={item.tier_id} className="text-xs font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                      {item.tier_name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Total Harga</span>
                <span className="text-xl font-black text-indigo-600">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                onClick={handleProceedClick}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-extrabold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all"
              >
                Lanjut Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
