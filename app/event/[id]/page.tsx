'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin, Ticket, Lock, Check, ShieldAlert, ArrowRight, User } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore, Seat } from '@/lib/store';

interface EventDetail {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  venue_name: string;
  start_date: string;
  end_date: string;
  capacity: number;
  banner_url: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();

  const { user, selectedSeats, toggleSeatSelection, clearSeatSelection, setActiveEventId } = useAppStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setActiveEventId(eventId);
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [evtRes, seatRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/seats`),
      ]);

      if (evtRes.data.success) {
        setEvent(evtRes.data.data);
      }
      if (seatRes.data.success) {
        setSeats(seatRes.data.data.seats);
      }
    } catch (err) {
      console.error('Failed to load event detail', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'sold') return;
    toggleSeatSelection(seat);
  };

  const handleLockAndCheckout = async () => {
    if (!user) {
      alert('Silakan login terlebih dahulu untuk memesan kursi!');
      return;
    }

    if (selectedSeats.length === 0) {
      setErrorMsg('Pilih minimal 1 kursi sebelum melanjutkan.');
      return;
    }

    setLocking(true);
    setErrorMsg('');

    try {
      // Lock seats sequentially / in batch
      for (const seat of selectedSeats) {
        await api.post('/tickets/lock-seat', {
          event_id: eventId,
          seat_id: seat.id,
        });
      }

      // Navigate to checkout page
      router.push('/checkout');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal mengunci kursi. Coba lagi.');
    } finally {
      setLocking(false);
    }
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-zinc-400 text-sm animate-pulse">
        Memuat tata letak seat map interaktif...
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

  // Group seats by Category & Row
  const categories = Array.from(new Set(seats.map((s) => s.category)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-32">
      {/* Event Header Banner */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-lg grid grid-cols-1 lg:grid-cols-3">
        <div className="relative h-64 lg:h-auto lg:col-span-1 bg-zinc-900">
          <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent lg:hidden" />
        </div>

        <div className="p-6 lg:p-8 lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 uppercase tracking-wider">
              {event.category}
            </span>
            <h1 className="text-2xl md:text-4xl font-extrabold text-zinc-900 dark:text-zinc-100">{event.name}</h1>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-zinc-400 font-semibold uppercase">Waktu Event</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {new Date(event.start_date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="block text-[10px] text-zinc-400 font-semibold uppercase">Lokasi Venue</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">{event.venue_name} ({event.location})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Seat Map Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-indigo-600" />
              Peta Kursi &amp; Kategori Tiket Interaktif
            </h2>
            <p className="text-xs text-zinc-500">Klik pada kursi yang tersedia untuk memilih tempat duduk Anda.</p>
          </div>

          {/* Seat Status Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950" />
              <span className="text-zinc-600 dark:text-zinc-400">Tersedia</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">✓</div>
              <span className="text-zinc-600 dark:text-zinc-400">Dipilih</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-amber-400 text-amber-950 flex items-center justify-center text-[10px] font-bold">🔒</div>
              <span className="text-zinc-600 dark:text-zinc-400">Terkunci (Hold)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-md bg-zinc-300 dark:bg-zinc-700 opacity-60" />
              <span className="text-zinc-600 dark:text-zinc-400">Terjual</span>
            </div>
          </div>
        </div>

        {/* Stage Diagram */}
        <div className="w-full max-w-xl mx-auto py-3 bg-gradient-to-r from-zinc-200 via-indigo-200 to-zinc-200 dark:from-zinc-800 dark:via-indigo-950 dark:to-zinc-800 rounded-xl text-center text-xs font-bold tracking-widest text-indigo-900 dark:text-indigo-300 uppercase shadow-inner">
          ══ PANGGUNG UTAMA / STAGE ARENA ══
        </div>

        {/* Seat Grid Layout */}
        <div className="space-y-8 pt-4">
          {categories.map((category) => {
            const catSeats = seats.filter((s) => s.category === category);
            const price = catSeats[0]?.price || 0;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-2">
                  <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${category === 'VIP' ? 'bg-amber-500' : category === 'CAT 1' ? 'bg-indigo-500' : category === 'CAT 2' ? 'bg-cyan-500' : 'bg-emerald-500'}`} />
                    Kategori {category}
                  </span>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    Rp {price.toLocaleString('id-ID')} / kursi
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  {catSeats.map((seat) => {
                    const isSelected = selectedSeats.some((s) => s.id === seat.id);
                    const isLocked = seat.status === 'locked';
                    const isSold = seat.status === 'sold';

                    let seatStyle = 'border-2 border-indigo-300 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-900 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200';
                    if (isSelected) {
                      seatStyle = 'bg-emerald-600 border-emerald-600 text-white font-bold scale-105 shadow-md shadow-emerald-600/30';
                    } else if (isLocked) {
                      seatStyle = 'bg-amber-400 border-amber-400 text-amber-950 font-bold cursor-not-allowed';
                    } else if (isSold) {
                      seatStyle = 'bg-zinc-200 border-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-600 cursor-not-allowed opacity-50';
                    }

                    return (
                      <button
                        key={seat.id}
                        disabled={isSold}
                        onClick={() => handleSeatClick(seat)}
                        className={`w-10 h-10 rounded-xl text-[11px] flex flex-col items-center justify-center transition-all ${seatStyle}`}
                        title={`Kursi ${seat.row}-${seat.number} (${seat.category}) — Rp ${seat.price.toLocaleString('id-ID')}`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : isLocked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : (
                          <span>{seat.row}{seat.number}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Bar for Selection Summary */}
      {selectedSeats.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 shadow-2xl py-4 px-6">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/30">
                {selectedSeats.length}
              </div>
              <div>
                <span className="block text-xs font-medium text-zinc-500">Kursi Dipilih</span>
                <div className="flex flex-wrap gap-1">
                  {selectedSeats.map((s) => (
                    <span key={s.id} className="text-xs font-bold text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                      {s.row}{s.number}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
              <div>
                <span className="block text-[10px] uppercase font-bold text-zinc-400">Total Harga</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                  Rp {totalPrice.toLocaleString('id-ID')}
                </span>
              </div>

              <button
                onClick={handleLockAndCheckout}
                disabled={locking}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-extrabold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all"
              >
                {locking ? 'Kunci Kursi...' : 'Lanjut Checkout'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
