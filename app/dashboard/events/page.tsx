'use client';

/**
 * /dashboard/events — Organizer Event Management
 *
 * Accessible: organizer, admin only.
 * Features:
 *  - List organizer's own events with live stats (sold/available/%)
 *  - Create event modal (full form)
 *  - Edit event modal (pre-filled)
 *  - Delete event (confirm dialog)
 *  - Publish / Unpublish toggle
 *  - Seat Category Manager per event (inline drawer)
 *  - Regenerate seat layout button
 *  - Banner URL update
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, Calendar, MapPin,
  Users, Ticket, BarChart2, ChevronRight, Layers, ImageIcon, AlertCircle,
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
  start_date: string;
  end_date: string;
  capacity: number;
  banner_url: string;
  status: 'published' | 'draft' | 'ended' | 'deleted';
  price_min: number;
  price_max: number;
  stats: EventStats;
}

interface SeatCategory {
  id: string;
  event_id: string;
  name: string;
  price: number;
  rows: string[];
  cols: number;
  color: string;
}

interface EventFormData {
  name: string;
  description: string;
  category: string;
  location: string;
  venue_name: string;
  start_date: string;
  end_date: string;
  capacity: string;
  banner_url: string;
  status: 'draft' | 'published';
}

interface CategoryFormData {
  name: string;
  price: string;
  rowsRaw: string; // comma-separated, e.g. "A,B,C"
  cols: string;
  color: string;
}

const BLANK_FORM: EventFormData = {
  name: '', description: '', category: 'Concert', location: '',
  venue_name: '', start_date: '', end_date: '', capacity: '0',
  banner_url: '', status: 'draft',
};

const BLANK_CAT: CategoryFormData = {
  name: '', price: '', rowsRaw: '', cols: '', color: '#6366F1',
};

const CATEGORIES = ['Concert', 'Conference', 'Festival', 'Sport', 'Exhibition', 'Workshop', 'General'];

/* ─── Utility Components ──────────────────────────────────── */
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
            {isEdit ? 'Update detail event Anda' : 'Isi form berikut untuk membuat event baru'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Event *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="Neon Genesis Music Festival 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as 'draft' | 'published')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lokasi *</label>
              <input value={form.location} onChange={(e) => set('location', e.target.value)}
                placeholder="JIExpo Kemayoran, Jakarta"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Venue */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Venue</label>
              <input value={form.venue_name} onChange={(e) => set('venue_name', e.target.value)}
                placeholder="Main Stage Arena A"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Start date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mulai *</label>
              <input type="datetime-local" value={form.start_date} onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* End date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Selesai *</label>
              <input type="datetime-local" value={form.end_date} onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kapasitas (override)</label>
              <input type="number" min="0" value={form.capacity} onChange={(e) => set('capacity', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Banner URL */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner URL</label>
              <input value={form.banner_url} onChange={(e) => set('banner_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi</label>
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

/* ─── Seat Category Drawer ────────────────────────────────── */
function SeatCategoryDrawer({ event, onClose }: { event: EventItem; onClose: () => void }) {
  const confirm = useConfirm();
  const [categories, setCategories] = useState<SeatCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<CategoryFormData>(BLANK_CAT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const loadCats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${event.id}/seat-categories`);
      if (res.data.success) setCategories(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [event.id]);

  useEffect(() => { loadCats(); }, [loadCats]);

  const setF = (k: keyof CategoryFormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleStartEdit = (cat: SeatCategory) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      price: String(cat.price),
      rowsRaw: cat.rows.join(','),
      cols: String(cat.cols),
      color: cat.color,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(BLANK_CAT);
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.rowsRaw || !form.cols) {
      setToast({ msg: 'Semua field wajib diisi.', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        catId: editingId || undefined,
        name: form.name,
        price: Number(form.price),
        rows: form.rowsRaw.split(',').map((r) => r.trim().toUpperCase()).filter(Boolean),
        cols: Number(form.cols),
        color: form.color,
      };
      const res = await api.post(`/events/${event.id}/seat-categories`, payload);
      if (res.data.success) {
        setToast({ msg: editingId ? 'Kategori diperbarui.' : 'Kategori ditambahkan.', type: 'success' });
        setEditingId(null);
        setForm(BLANK_CAT);
        loadCats();
      }
    } catch {
      setToast({ msg: 'Gagal menyimpan kategori.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (catId: string, catName: string) => {
    const ok = await confirm({
      title: `Hapus Kategori "${catName}"?`,
      message: 'Kursi di kategori ini akan dihapus dari layout. Tiket yang sudah terjual tidak terpengaruh.',
      confirmText: 'Hapus Kategori',
      cancelText: 'Batal',
      variant: 'danger',
    });
    if (!ok) return;
    try {
      await api.delete(`/events/${event.id}/seat-categories/${catId}`);
      setToast({ msg: 'Kategori dihapus.', type: 'success' });
      loadCats();
    } catch {
      setToast({ msg: 'Gagal menghapus.', type: 'error' });
    }
  };

  const handleRegenerate = async () => {
    const ok = await confirm({
      title: 'Regenerasi Layout Kursi?',
      message: 'Semua kursi available & locked akan di-reset ulang sesuai kategori. Kursi yang sudah terjual tetap aman.',
      confirmText: 'Regenerasi Sekarang',
      cancelText: 'Batal',
      variant: 'warning',
    });
    if (!ok) return;
    setRegenerating(true);
    try {
      const res = await api.post(`/events/${event.id}/regenerate-seats`);
      if (res.data.success) {
        setToast({ msg: `Layout di-regenerasi: ${res.data.data.total_seats} kursi total.`, type: 'success' });
      }
    } catch {
      setToast({ msg: 'Gagal regenerasi.', type: 'error' });
    } finally {
      setRegenerating(false);
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
                <Layers className="w-5 h-5" /> Seat Category Manager
              </h2>
              <p className="text-violet-200 text-xs mt-0.5 font-medium truncate">{event.name}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors text-sm font-bold">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Category List */}
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm animate-pulse">Memuat kategori...</div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition-colors">
                  <div className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow-sm" style={{ backgroundColor: cat.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{cat.name}</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                        Baris: {cat.rows.join(', ')} · {cat.cols} kursi/baris
                      </span>
                    </div>
                    <span className="text-xs text-indigo-700 font-bold">
                      Rp {cat.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleStartEdit(cat)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(cat.id, cat.name)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm">Belum ada kategori kursi.</div>
              )}
            </div>
          )}

          {/* Category Form */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-indigo-800">
              {editingId ? '✏️ Edit Kategori' : '+ Tambah Kategori Baru'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kategori</label>
                <input value={form.name} onChange={(e) => setF('name', e.target.value)}
                  placeholder="VIP / CAT 1 / FESTIVAL"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp)</label>
                <input type="number" min="0" value={form.price} onChange={(e) => setF('price', e.target.value)}
                  placeholder="1500000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Baris (pisah koma)</label>
                <input value={form.rowsRaw} onChange={(e) => setF('rowsRaw', e.target.value)}
                  placeholder="A, B, C"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kursi per Baris</label>
                <input type="number" min="1" value={form.cols} onChange={(e) => setF('cols', e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Warna</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={form.color} onChange={(e) => setF('color', e.target.value)}
                    className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer" />
                  <span className="text-xs font-mono text-slate-600">{form.color}</span>
                </div>
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
                {saving ? 'Menyimpan...' : editingId ? 'Update Kategori' : 'Tambah Kategori'}
              </button>
            </div>
          </div>

          {/* Regenerate button */}
          <button onClick={handleRegenerate} disabled={regenerating}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-violet-300 text-violet-700 text-xs font-bold hover:bg-violet-50 transition-colors flex items-center justify-center gap-2">
            {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {regenerating ? 'Meregenerasi layout...' : 'Regenerasi Layout Kursi dari Kategori'}
          </button>
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
  onManageSeats,
}: {
  event: EventItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onManageSeats: () => void;
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
            <div className="text-[9px] font-bold uppercase text-slate-400">Total</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
            <div className="text-xs font-black text-emerald-800">{event.stats.sold_seats}</div>
            <div className="text-[9px] font-bold uppercase text-emerald-600">Terjual</div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-2 border border-indigo-100">
            <div className="text-xs font-black text-indigo-800">{event.stats.sold_percent}%</div>
            <div className="text-[9px] font-bold uppercase text-indigo-600">Occupancy</div>
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
          <button onClick={onManageSeats}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors">
            <Layers className="w-3.5 h-3.5" /> Seat Map
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
  const [managingSeatsFor, setManagingSeatsFor] = useState<EventItem | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Guard: redirect if not organizer/admin
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
      // new event — add with empty stats
      return [{ ...saved, stats: { total_seats: 0, sold_seats: 0, available_seats: 0, sold_percent: 0 } }, ...prev];
    });
    setToast({ msg: editingEvent ? 'Event berhasil diperbarui!' : 'Event baru berhasil dibuat!', type: 'success' });
    setEditingEvent(null);
    // Reload to get fresh stats
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
        : 'Event akan disembunyikan dari katalog publik. Tiket yang sudah terjual tidak terpengaruh.',
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

  // Not logged in or wrong role
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-xl font-black text-slate-900">Login Diperlukan</h1>
        <p className="text-sm text-slate-500 mt-1">Silakan login sebagai <strong>organizer</strong> untuk mengakses halaman ini.</p>
      </div>
    );
  }

  if (user.role !== 'organizer' && user.role !== 'admin') {
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
      {managingSeatsFor && (
        <SeatCategoryDrawer event={managingSeatsFor} onClose={() => setManagingSeatsFor(null)} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-800">Manajemen Event</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-indigo-600" />
            Manajemen Event
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Buat, edit, dan kelola event beserta seat map dan kategori harga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={loadEvents}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Buat Event
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {(['all', 'published', 'draft'] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filterStatus === s ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}>
            {s === 'all' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Event', value: events.length, icon: BarChart2, color: 'bg-indigo-50 text-indigo-700' },
          { label: 'Published', value: events.filter((e) => e.status === 'published').length, icon: Eye, color: 'bg-emerald-50 text-emerald-700' },
          { label: 'Draft', value: events.filter((e) => e.status === 'draft').length, icon: Pencil, color: 'bg-amber-50 text-amber-700' },
          {
            label: 'Total Tiket Terjual',
            value: events.reduce((acc, e) => acc + e.stats.sold_seats, 0),
            icon: Ticket,
            color: 'bg-violet-50 text-violet-700',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
            <div className={`p-2.5 rounded-xl ${color}`}><Icon className="w-4 h-4" /></div>
            <div>
              <div className="text-xl font-black text-slate-900">{value}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse font-medium">Memuat events...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-3xl">
          <BarChart2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">Belum ada event</h3>
          <p className="text-sm text-slate-400 mt-1 mb-4">Mulai dengan membuat event pertama Anda.</p>
          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md transition-colors"
          >
            <Plus className="w-4 h-4" /> Buat Event Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => { setEditingEvent(event); setShowForm(true); }}
              onDelete={() => handleDelete(event)}
              onToggleStatus={() => handleToggleStatus(event)}
              onManageSeats={() => setManagingSeatsFor(event)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
