'use client';

/**
 * /dashboard/events — Organizer Event Management (Tier Based)
 *
 * Accessible: organizer, admin only.
 * Features:
 *  - List organizer's own events with live tier stats (quota/sold/%)
 *  - Create event modal (full form including venue layout description)
 *  - Edit event modal
 *  - Delete event
 *  - Publish / Unpublish toggle
 *  - Ticket Tier Manager per event (inline drawer)
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Ticket, Settings2, ArrowLeft, XCircle, CheckCircle2, AlertCircle, Search, Filter, X
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useConfirm } from '@/hooks/useConfirm';
import EventFormModal, { EventItem } from '@/components/dashboard/EventFormModal';
import TicketTierDrawer from '@/components/dashboard/TicketTierDrawer';
import SessionDrawer from '@/components/dashboard/SessionDrawer';
import EventCard from '@/components/dashboard/EventCard';

const CATEGORIES = ['All', 'Concert', 'Festival', 'Conference', 'Sport', 'Exhibition', 'Workshop', 'General'] as const;

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold animate-in slide-in-from-top-2 ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

export default function OrganizerEventsPage() {
  const { user } = useAppStore();
  const router = useRouter();
  const confirm = useConfirm();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [managingTiersFor, setManagingTiersFor] = useState<EventItem | null>(null);
  const [managingSessionsFor, setManagingSessionsFor] = useState<EventItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/events/me');
      if (res.data.success) setEvents(res.data.data);
    } catch {
      setToast({ msg: 'Gagal memuat events. Pastikan Anda login sebagai organizer.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleEventSaved = (saved: EventItem) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...saved };
        return next;
      }
      return [{ ...saved, stats: { total_seats: 4700, sold_seats: 0, available_seats: 4700, sold_percent: 0 } }, ...prev];
    });
    setToast({ msg: editingEvent ? 'Event berhasil diperbarui.' : 'Event baru berhasil diterbitkan.', type: 'success' });
    setEditingEvent(null);
    setTimeout(loadEvents, 300);
  };

  const handleDelete = async (event: EventItem) => {
    const ok = await confirm({
      title: `Hapus Event "${event.name}"?`,
      message: 'Event akan di-nonaktifkan (soft delete). Data tiket yang sudah terjual tetap tersimpan di riwayat transaksi.',
      confirmText: 'Hapus Event',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/events/${event.id}`);
      setToast({ msg: 'Event berhasil dihapus.', type: 'success' });
      setEvents((prev) => prev.filter((e) => e.id !== event.id));
    } catch {
      setToast({ msg: 'Gagal menghapus event.', type: 'error' });
    }
  };

  const handleToggleStatus = async (event: EventItem) => {
    const toPublish = event.status !== 'published';
    const ok = await confirm({
      title: toPublish ? `Publish Event "${event.name}"?` : `Unpublish Event "${event.name}"?`,
      message: toPublish
        ? 'Event akan terlihat oleh publik di katalog dan tiket dapat segera dibeli.'
        : 'Event akan disembunyikan dari katalog publik.',
      confirmText: toPublish ? 'Publish Sekarang' : 'Unpublish',
      cancelText: 'Batal',
      variant: toPublish ? 'info' : 'warning',
    });
    if (!ok) return;
    try {
      const res = await api.put(`/events/${event.id}`, { status: toPublish ? 'published' : 'draft' });
      if (res.data.success) {
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: toPublish ? 'published' : 'draft' } : e))
        );
        setToast({ msg: `Event ${toPublish ? 'dipublish' : 'di-unpublish'}.`, type: 'success' });
      }
    } catch {
      setToast({ msg: 'Gagal mengubah status publikasi event.', type: 'error' });
    }
  };

  // Tab counts
  const allCount = events.length;
  const publishedCount = useMemo(() => events.filter((e) => e.status === 'published').length, [events]);
  const draftCount = useMemo(() => events.filter((e) => e.status === 'draft').length, [events]);

  // Combined filters: Status + Category + Search Query
  const filtered = useMemo(() => {
    return events.filter((e) => {
      const matchStatus = filterStatus === 'all' || e.status === filterStatus;
      const matchCategory =
        selectedCategory === 'All' ||
        (e.category && e.category.toLowerCase() === selectedCategory.toLowerCase());
      const query = searchQuery.toLowerCase().trim();
      const matchQuery =
        !query ||
        (e.name && e.name.toLowerCase().includes(query)) ||
        (e.location && e.location.toLowerCase().includes(query)) ||
        (e.venue_name && e.venue_name.toLowerCase().includes(query));

      return matchStatus && matchCategory && matchQuery;
    });
  }, [events, filterStatus, selectedCategory, searchQuery]);

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h1 className="text-xl font-black text-zinc-950">Akses Terbatas</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Halaman ini khusus untuk akun berwenang organizer dan administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full max-w-full overflow-x-hidden">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {showForm && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
          onSaved={handleEventSaved}
        />
      )}
      {managingTiersFor && (
        <TicketTierDrawer event={managingTiersFor} onClose={() => setManagingTiersFor(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-bold text-zinc-800">Manajemen Event</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2 tracking-tight">
            <Settings2 className="w-6 h-6 text-zinc-900" />
            Pengelolaan Event &amp; Tiket
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Buat event baru, atur zonasi area panggung penonton, dan sesuaikan kuota tiket per tier.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 shadow-xs transition-all tactile-btn"
        >
          <Plus className="w-4 h-4" /> Buat Event Baru
        </button>
      </div>

      {/* Navigation Tabs with Badges & Search/Category Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        {/* Status Tabs with Count Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'Semua Event', count: allCount },
              { id: 'published', label: 'Published', count: publishedCount },
              { id: 'draft', label: 'Draft', count: draftCount },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all tactile-btn ${
                filterStatus === tab.id
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'bg-zinc-100 text-zinc-600 border border-zinc-200/60'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari event, lokasi, venue..."
              className="w-full pl-8 pr-7 py-1.5 bg-white border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-0.5"
                title="Hapus pencarian"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-2.5 py-1 text-xs">
            <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="All">Semua Kategori</option>
              {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-950 underline px-1 py-1"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="text-center py-20 text-zinc-400 text-xs animate-pulse font-medium">Memuat daftar event Anda...</div>
      ) : filtered.length === 0 ? (
        events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-zinc-200 p-8 space-y-3 shadow-2xs">
            <Ticket className="w-10 h-10 text-zinc-300 mx-auto" />
            <h3 className="text-base font-extrabold text-zinc-950">Belum Ada Event</h3>
            <p className="text-xs text-zinc-500">Klik tombol &ldquo;Buat Event Baru&rdquo; di atas untuk menerbitkan event pertama Anda.</p>
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 p-8 space-y-3 shadow-2xs">
            <Search className="w-10 h-10 text-zinc-300 mx-auto" />
            <h3 className="text-base font-extrabold text-zinc-950">Event Tidak Ditemukan</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Tidak ada event yang sesuai dengan status &ldquo;{filterStatus}&rdquo;, kategori &ldquo;{selectedCategory}&rdquo;, atau kata kunci &ldquo;{searchQuery}&rdquo;.
            </p>
            <button
              onClick={() => {
                setFilterStatus('all');
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition tactile-btn"
            >
              Reset Semua Filter
            </button>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              onEdit={() => {
                setEditingEvent(evt);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(evt)}
              onToggleStatus={() => handleToggleStatus(evt)}
              onManageTiers={() => setManagingTiersFor(evt)}
              onManageSessions={() => setManagingSessionsFor(evt)}
            />
          ))}
        </div>
      )}

      {/* Ticket Tier Drawer */}
      {managingTiersFor && (
        <TicketTierDrawer
          event={managingTiersFor}
          onClose={() => {
            setManagingTiersFor(null);
            loadEvents();
          }}
        />
      )}

      {/* Session Drawer for Multi-Day Management */}
      {managingSessionsFor && (
        <SessionDrawer
          isOpen={!!managingSessionsFor}
          onClose={() => setManagingSessionsFor(null)}
          eventId={managingSessionsFor.id}
          eventName={managingSessionsFor.name}
          startDate={managingSessionsFor.start_date}
          endDate={managingSessionsFor.end_date}
        />
      )}
    </div>
  );
}
