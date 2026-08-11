'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, MapPin, Ticket, ShieldCheck, Zap, Sparkles } from 'lucide-react';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Catalog Header */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white p-8 md:p-12 shadow-2xl shadow-indigo-500/10 border border-indigo-400/30">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            White-Label Dynamic Ticketing Engine
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight drop-shadow-sm">
            Jelajahi &amp; Pesan Tiket Event
          </h1>
          <p className="text-indigo-50 text-sm md:text-base leading-relaxed font-medium">
            Pesan tiket resmi dengan sistem distributed seat lock real-time, QR dinamis rotasi 30-detik anti-bot, dan sistem verifikasi gate kilat.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-semibold text-white">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shadow-xs">
              <Zap className="w-4 h-4 text-yellow-300 fill-yellow-300" />
              Sub-500ms Gate Verification
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/20 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              AES-256 Dynamic QR Rotation
            </div>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-cyan-200 to-transparent" />
      </section>

      {/* Filter & Search Bar */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {['All', 'Concert', 'Conference'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {cat === 'All' ? '🔥 Semua Event' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama event / lokasi..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </section>

      {/* Event Grid */}
      <section>
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm animate-pulse font-medium">
            Memuat daftar event festival...
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm bg-white rounded-2xl border border-slate-200 font-medium">
            Tidak ada event yang sesuai dengan pencarian Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-200 transition-all duration-300 flex flex-col"
              >
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={evt.banner_url}
                    alt={evt.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-cyan-300 border border-white/20">
                    {evt.category}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                      {evt.description}
                    </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <span>{new Date(evt.start_date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cyan-600 flex-shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Mulai dari</span>
                      <span className="font-black text-base text-indigo-600">
                        Rp {evt.price_min.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <Link
                      href={`/event/${evt.id}`}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      Pilih Kursi
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
