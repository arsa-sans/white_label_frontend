'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, MapPin, ArrowRight, ShieldCheck, Zap, Ticket, Sparkles } from 'lucide-react';
import api from '@/lib/api';

interface EventItem {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  venue_name: string;
  start_date: string;
  banner_url: string;
  price_min: number;
  price_max: number;
}

export default function EventsCatalogPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      const res = await api.get('/events', { params });
      if (res.data.success) {
        setEvents(res.data.data);
      }
    } catch {
      // Quiet UI error handling
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      {/* ─── Bento Catalog Header ──────────────────────────────────────── */}
      <section className="bg-white border border-zinc-200 rounded-3xl p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-bold text-zinc-800">
            <Ticket className="w-3.5 h-3.5 text-zinc-900" />
            Katalog Tiket Resmi
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-950 leading-tight">
            Jelajahi &amp; Pesan Tiket Event
          </h1>
          <p className="text-zinc-600 text-xs sm:text-sm md:text-base leading-relaxed font-normal">
            Pesan tiket resmi dengan sistem *distributed seat lock* real-time, QR dinamis rotasi 30-detik anti-bot, dan sistem verifikasi gate kilat.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1 text-xs font-semibold text-zinc-700">
            <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-zinc-900" />
              Sub-500ms Gate Verification
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-xl border border-zinc-200 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-900" />
              AES-256 Dynamic QR Rotation
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filter & Search Bar ───────────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-xs">
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Concert', 'Conference'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all tactile-btn ${
                selectedCategory === cat
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200/80'
              }`}
            >
              {cat === 'All' ? 'Semua Event' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari event / lokasi..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 bg-zinc-50 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition-all font-medium"
          />
        </div>
      </section>

      {/* ─── Event Grid ────────────────────────────────────────────────── */}
      <section>
        {loading ? (
          <div className="text-center py-16 text-zinc-400 text-xs animate-pulse font-medium">
            Memuat daftar event festival...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs bg-white rounded-2xl border border-zinc-200 font-medium">
            Tidak ada event yang sesuai dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="group bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-xs hover:border-zinc-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-zinc-100">
                  <img
                    src={evt.banner_url}
                    alt={evt.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  />

                  <div className="absolute top-3 left-3 bg-zinc-950/85 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white">
                    {evt.category}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <h3 className="font-extrabold text-base text-zinc-950 line-clamp-1">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-normal">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-zinc-100 text-xs font-semibold text-zinc-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                      <span>{new Date(evt.start_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-zinc-700 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-zinc-100">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-zinc-400">Mulai dari</span>
                      <span className="font-black text-sm text-zinc-950 font-mono tabular-nums">
                        Rp {evt.price_min.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <Link
                      href={`/event/${evt.id}`}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-all tactile-btn"
                    >
                      <span>Beli Tiket</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

