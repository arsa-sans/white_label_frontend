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
  Plus, Pencil, Trash2, Eye, EyeOff, Calendar, MapPin,
  Ticket, Layers, ImageIcon, AlertCircle,
  CheckCircle, XCircle, Loader2, Settings2, ArrowLeft
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useConfirm } from '@/hooks/useConfirm';

/* ─── Types ───────────────────────────────────────────────── */
interface EventStats {
  total_seats: number;
  sold_seats: number;
  available_seats: number;
  sold_percent: number;
}

interface EventItem {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  venue_name: string;
  venue_layout_info?: string;
  start_date: string;
  end_date: string;
  capacity: number;
  banner_url: string;
  status: 'published' | 'draft' | 'ended' | 'deleted';
  price_min: number;
  price_max: number;
  stats: EventStats;
}

interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  quota: number;
  sold: number;
  color: string;
  sort_order: number;
}

interface EventFormData {
  name: string;
  description: string;
  category: string;
  location: string;
  venue_name: string;
  venue_layout_info: string;
  start_date: string;
  end_date: string;
  capacity: string;
  banner_url: string;
  status: 'draft' | 'published';
}

interface TierFormData {
  name: string;
  description: string;
  price: string;
  quota: string;
  color: string;
  sort_order: string;
}

const BLANK_FORM: EventFormData = {
  name: '', description: '', category: 'Concert', location: '',
  venue_name: '', venue_layout_info: '', start_date: '', end_date: '', capacity: '0',
  banner_url: '', status: 'draft',
};

const BLANK_TIER: TierFormData = {
  name: '', description: '', price: '', quota: '', color: '#7C3AED', sort_order: '1',
};

const CATEGORIES = ['Concert', 'Conference', 'Festival', 'Sport', 'Exhibition', 'Workshop', 'General'];

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    draft: 'bg-amber-100 text-amber-800 border-amber-200',
    ended: 'bg-slate-100 text-slate-600 border-slate-200',
    deleted: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[status] || map.draft}`}>
      {status}
    </span>
  );
}

/* ─── Event Form Modal ────────────────────────────────────── */
function EventFormModal({
  event,
  onClose,
  onSaved,
}: {
  event?: EventItem | null;
  onClose: () => void;
  onSaved: (e: EventItem) => void;
}) {
  const isEdit = !!event;
  const [form, setForm] = useState<EventFormData>(
    event
      ? {
          name: event.name,
          description: event.description,
          category: event.category,
          location: event.location,
          venue_name: event.venue_name,
          venue_layout_info: event.venue_layout_info || '',
          start_date: event.start_date.slice(0, 16),
          end_date: event.end_date.slice(0, 16),
          capacity: String(event.capacity),
          banner_url: event.banner_url,
          status: event.status === 'published' ? 'published' : 'draft',
        }
      : BLANK_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof EventFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.location || !form.start_date || !form.end_date) {
      setError('Nama, lokasi, dan tanggal wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      let res;
      if (isEdit && event) {
        res = await api.put(`/events/${event.id}`, payload);
      } else {
        res = await api.post('/events', payload);
      }
      if (res.data.success) {
        onSaved(res.data.data);
        onClose();
      } else {
        setError(res.data.error || 'Gagal menyimpan.');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Server error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <h2 className="text-lg font-black text-white">{isEdit ? '✏️ Edit Event' : '✨ Buat Event Baru'}</h2>
          <p className="text-indigo-200 text-xs mt-0.5 font-medium">
            {isEdit ? 'Update detail event Anda' : 'Isi form berikut untuk membuat event baru (tier tiket default akan dibuat otomatis)'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Event *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="Neon Genesis Music Festival 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as 'draft' | 'published')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lokasi *</label>
              <input value={form.location} onChange={(e) => set('location', e.target.value)}
                placeholder="JIExpo Kemayoran, Jakarta"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Venue</label>
              <input value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)}
                placeholder="Main Stage Arena A"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mulai *</label>
              <input type="datetime-local" value={form.start_date} onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Selesai *</label>
              <input type="datetime-local" value={form.end_date} onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tata Letak Area Penonton &amp; Panggung</label>
              <input value={form.venue_layout_info} onChange={(e) => set('venue_layout_info', e.target.value)}
                placeholder="Misal: Panggung di titik Utara. VIP jarak 0-10m, CAT 1 10-25m, Festival di belakang."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner URL</label>
              <input value={form.banner_url} onChange={(e) => set('banner_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Event</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
                rows={3} placeholder="Deskripsi singkat event Anda..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors">
              Batal
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-colors flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Ticket Tier Manager Drawer ───────────────────────────── */
function TicketTierDrawer({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const confirm = useConfirm();
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<TierFormData>(BLANK_TIER);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadTiers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${event.id}/tiers`);
      if (res.data.success) setTiers(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => { loadTiers(); }, [loadTiers]);

  const setF = (k: keyof TierFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleStartEdit = (tier: TicketTier) => {
    setEditingId(tier.id);
    setForm({
      name: tier.name,
      description: tier.description || '',
      price: String(tier.price),
      quota: String(tier.quota),
      color: tier.color,
      sort_order: String(tier.sort_order),
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(BLANK_TIER);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.quota) {
      setToast({ msg: 'Nama, harga, dan kuota wajib diisi.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tierId: editingId || undefined,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        quota: Number(form.quota),
        color: form.color,
        sort_order: Number(form.sort_order),
      };
      const res = await api.post(`/events/${event.id}/tiers`, payload);
      if (res.data.success) {
        setToast({ msg: editingId ? 'Tier tiket diperbarui.' : 'Tier tiket ditambahkan.', type: 'success' });
        setEditingId(null);
        setForm(BLANK_TIER);
        loadTiers();
      }
    } catch {
      setToast({ msg: 'Gagal menyimpan tier tiket.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tierId: string, tierName: string) => {
    const ok = await confirm({
      title: `Hapus Tier Tiket "${tierName}"?`,
      message: 'Tier ini akan dihapus dari event. Tiket yang sudah terjual tidak terpengaruh.',
      confirmText: 'Hapus Tier',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/events/${event.id}/tiers/${tierId}`);
      setToast({ msg: 'Tier tiket dihapus.', type: 'success' });
      loadTiers();
    } catch {
      setToast({ msg: 'Gagal menghapus.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Layers className="w-5 h-5" /> Pengelolaan Tier Tiket &amp; Tata Letak
              </h2>
              <p className="text-violet-200 text-xs mt-0.5 font-medium truncate">{event.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors text-sm font-bold">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Tier List */}
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm animate-pulse">Memuat tier tiket...</div>
          ) : (
            <div className="space-y-2">
              {tiers.map((tier) => (
                <div key={tier.id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                  <div className="w-4 h-4 rounded-full shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: tier.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{tier.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        Terjual: {tier.sold} / Kuota: {tier.quota}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-xs text-slate-500 truncate mt-0.5">{tier.description}</p>
                    )}
                    <span className="text-xs text-indigo-700 font-extrabold mt-0.5 block">
                      Rp {tier.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleStartEdit(tier)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(tier.id, tier.name)}
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {tiers.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">Belum ada tier tiket.</div>
              )}
            </div>
          )}

          {/* Tier Form */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800">
              {editingId ? '✏️ Edit Tier Tiket' : '+ Tambah Tier Tiket Baru'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Tier (Zona Penonton)</label>
                <input value={form.name} onChange={(e) => setF('name', e.target.value)}
                  placeholder="VIP (0-10m dari panggung)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga Tiket (Rp)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setF('price', e.target.value)}
                  placeholder="1800000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kuota Tiket</label>
                <input type="number" min="1" value={form.quota} onChange={(e) => setF('quota', e.target.value)}
                  placeholder="200"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warna Badge</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setF('color', e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer" />
                  <span className="text-xs font-mono text-slate-600">{form.color}</span>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Zona &amp; Jarak dari Panggung</label>
                <input value={form.description} onChange={(e) => setF('description', e.target.value)}
                  placeholder="Terdiri dari berdiri paling depan panggung utama, termasuk Fast-Track Gate."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex gap-2">
              {editingId && (
                <button onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white transition-colors">
                  Batal
                </button>
              )}
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/15">
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Menyimpan...' : editingId ? 'Update Tier' : 'Tambah Tier Tiket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Event Card ──────────────────────────────────────────── */
function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageTiers,
}: {
  event: EventItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onManageTiers: () => void;
}) {
  const isPublished = event.status === 'published';
  const dateStr = new Date(event.start_date).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden group">
      {/* Banner */}
      <div className="relative h-36 overflow-hidden bg-slate-100">
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={event.status} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 left-3">
          <span className="text-[10px] font-bold text-white/90 bg-black/30 px-2 py-0.5 rounded-full">{event.category}</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{event.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3 shrink-0" /> {dateStr}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <div className="text-xs font-black text-slate-900">{event.stats.total_seats}</div>
            <div className="text-[9px] font-bold uppercase text-slate-400">Kuota</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
            <div className="text-xs font-black text-emerald-800">{event.stats.sold_seats}</div>
            <div className="text-[9px] font-bold uppercase text-emerald-600">Terjual</div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-2 border border-indigo-100">
            <div className="text-xs font-black text-indigo-800">{event.stats.sold_percent}%</div>
            <div className="text-[9px] font-bold uppercase text-indigo-600">Terisi</div>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="space-y-1">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
              style={{ width: `${event.stats.sold_percent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Rp {event.price_min.toLocaleString('id-ID')} – Rp {event.price_max.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onManageTiers}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors flex-1 justify-center">
            <Layers className="w-3.5 h-3.5" /> Tier Tiket
          </button>
          <button onClick={onToggleStatus}
            title={isPublished ? 'Unpublish' : 'Publish'}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
              isPublished
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}>
            {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button onClick={onEdit}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
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

  useEffect(() => { loadEvents(); }, [loadEvents]);

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
          prev.map((e) => e.id === event.id ? { ...e, status: toPublish ? 'published' : 'draft' } : e)
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
        <p className="text-sm text-slate-500 mt-1">Halaman ini hanya untuk <strong>organizer</strong> dan <strong>admin</strong>.</p>
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
          onClose={() => { setShowForm(false); setEditingEvent(null); }}
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
            <button onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
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

        <button onClick={() => { setEditingEvent(null); setShowForm(true); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all">
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
              onEdit={() => { setEditingEvent(evt); setShowForm(true); }}
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
