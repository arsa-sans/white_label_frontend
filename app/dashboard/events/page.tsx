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

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Ticket, Settings2, ArrowLeft, XCircle, CheckCircle
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useConfirm } from '@/hooks/useConfirm';
import EventFormModal, { EventItem } from '@/components/dashboard/EventFormModal';
import TicketTierDrawer from '@/components/dashboard/TicketTierDrawer';
import EventCard from '@/components/dashboard/EventCard';

function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-sm font-semibold animate-in slide-in-from-top-2 ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-800'
      }`}
    >
      {type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
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
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [managingTiersFor, setManagingTiersFor] = useState<EventItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      router.replace('/');
    }
  }, [user, router]);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const res = await api.get(`/events/me${params}`);
      if (res.data.success) setEvents(res.data.data);
    } catch {
      setToast({ msg: 'Gagal memuat events. Pastikan Anda login sebagai organizer.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

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
    setToast({ msg: editingEvent ? 'Event berhasil diperbarui!' : 'Event baru berhasil dibuat!', type: 'success' });
    setEditingEvent(null);
    setTimeout(loadEvents, 300);
  };

  const handleDelete = async (event: EventItem) => {
    const ok = await confirm({
      title: `Hapus Event "${event.name}"?`,
      message: 'Event akan di-nonaktifkan (soft delete). Data tiket yang sudah terjual tetap tersimpan.',
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
        ? 'Event akan terlihat oleh publik dan bisa dibeli tiketnya.'
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
      setToast({ msg: 'Gagal mengubah status.', type: 'error' });
    }
  };

  if (!user || (user.role !== 'organizer' && user.role !== 'admin')) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h1 className="text-xl font-black text-slate-900">Akses Ditolak</h1>
        <p className="text-sm text-slate-500 mt-1">
          Halaman ini hanya untuk <strong>organizer</strong> dan <strong>admin</strong>.
        </p>
      </div>
    );
  }

  const filtered = filterStatus === 'all' ? events : events.filter((e) => e.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-bold text-slate-800">Pengelolaan Event</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            Pengelolaan Event (CRUD Event)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Buat event baru, atur tata letak area penonton, dan kelola tier tiket berdasarkan jarak panggung.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" /> Buat Event Baru
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['all', 'published', 'draft'] as const).map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
              filterStatus === st
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            {st === 'all' ? 'Semua Event' : st}
          </button>
        ))}
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse font-medium">Memuat event Anda...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Ticket className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Event</h3>
          <p className="text-xs text-slate-500">Klik tombol "Buat Event Baru" di atas untuk menambahkan event pertama Anda.</p>
        </div>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
