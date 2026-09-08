'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2, Calendar, Clock, MapPin, Users, Plus, Trash2, X } from 'lucide-react';
import api from '@/lib/api';

export interface GuestStar {
  name: string;
  photo_url: string;
  role: string;
}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  venue_name: string;
  venue_layout_info?: string;
  venue_map_url?: string;
  guest_stars?: GuestStar[];
  start_date: string;
  end_date: string;
  sale_start_at?: string;
  sale_end_at?: string;
  capacity: number;
  banner_url: string;
  status: 'published' | 'draft' | 'ended' | 'deleted';
  price_min: number;
  price_max: number;
  stats: {
    total_seats: number;
    sold_seats: number;
    available_seats: number;
    sold_percent: number;
  };
}

export interface EventFormData {
  name: string;
  description: string;
  category: string;
  location: string;
  venue_name: string;
  venue_layout_info: string;
  venue_map_url: string;
  guest_stars: GuestStar[];
  start_date: string;
  end_date: string;
  sale_start_at: string;
  sale_end_at: string;
  capacity: string;
  banner_url: string;
  status: 'draft' | 'published';
}

const BLANK_FORM: EventFormData = {
  name: '',
  description: '',
  category: 'Concert',
  location: '',
  venue_name: '',
  venue_layout_info: '',
  venue_map_url: '',
  guest_stars: [],
  start_date: '',
  end_date: '',
  sale_start_at: '',
  sale_end_at: '',
  capacity: '0',
  banner_url: '',
  status: 'draft',
};

const CATEGORIES = ['Concert', 'Conference', 'Festival', 'Sport', 'Exhibition', 'Workshop', 'General'];

interface EventFormModalProps {
  event?: EventItem | null;
  onClose: () => void;
  onSaved: (e: EventItem) => void;
}

export default function EventFormModal({ event, onClose, onSaved }: EventFormModalProps) {
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
          venue_map_url: event.venue_map_url || '',
          guest_stars: event.guest_stars || [],
          start_date: event.start_date ? event.start_date.slice(0, 16) : '',
          end_date: event.end_date ? event.end_date.slice(0, 16) : '',
          sale_start_at: event.sale_start_at ? event.sale_start_at.slice(0, 16) : '',
          sale_end_at: event.sale_end_at ? event.sale_end_at.slice(0, 16) : '',
          capacity: String(event.capacity),
          banner_url: event.banner_url,
          status: event.status === 'published' ? 'published' : 'draft',
        }
      : BLANK_FORM
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof EventFormData, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleAddGuestStar = () => {
    setForm((f) => ({
      ...f,
      guest_stars: [...f.guest_stars, { name: '', role: 'Guest Star', photo_url: '' }],
    }));
  };

  const handleUpdateGuestStar = (index: number, field: keyof GuestStar, value: string) => {
    setForm((f) => {
      const updated = [...f.guest_stars];
      updated[index] = { ...updated[index], [field]: value };
      return { ...f, guest_stars: updated };
    });
  };

  const handleRemoveGuestStar = (index: number) => {
    setForm((f) => ({
      ...f,
      guest_stars: f.guest_stars.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.location || !form.start_date || !form.end_date) {
      setError('Nama, lokasi, dan tanggal wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        guest_stars: form.guest_stars.filter((g) => g.name.trim().length > 0),
      };
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
    <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (Clean Bento Monochrome) */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-950">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">
                {isEdit ? 'Edit Event' : 'Buat Event Baru'}
              </h2>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium">
                {isEdit
                  ? 'Perbarui detail dan jadwal event Anda'
                  : 'Lengkapi formulir untuk menerbitkan event di platform'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Nama Event *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Soundwave Music Festival 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as 'draft' | 'published')}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Lokasi Kota / Daerah *</label>
              <input
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="JIExpo Kemayoran, Jakarta"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Nama Venue / Hall</label>
              <input
                value={form.venue_name}
                onChange={(e) => set('venue_name', e.target.value)}
                placeholder="Main Stage Arena A"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Tanggal Mulai Event *</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Tanggal Selesai Event *</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-zinc-500" /> Penjualan Tiket Dibuka</span>
              </label>
              <input
                type="datetime-local"
                value={form.sale_start_at}
                onChange={(e) => set('sale_start_at', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-zinc-500" /> Penjualan Tiket Ditutup</span>
              </label>
              <input
                type="datetime-local"
                value={form.sale_end_at}
                onChange={(e) => set('sale_end_at', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition font-mono"
              />
            </div>

            {/* Google Maps Link */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-zinc-500" /> URL Google Maps (Peta Lokasi Event)</span>
              </label>
              <input
                value={form.venue_map_url}
                onChange={(e) => set('venue_map_url', e.target.value)}
                placeholder="https://maps.google.com/?q=-6.1492,106.8455"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              />
              <p className="text-[11px] text-zinc-400 mt-1">
                Link ini akan ditampilkan di halaman detail event sebagai navigasi pengunjung.
              </p>
            </div>

            {/* Guest Stars Section */}
            <div className="sm:col-span-2 border border-zinc-200 bg-zinc-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-extrabold text-zinc-950 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-zinc-700" />
                    Bintang Tamu &amp; Pengisi Acara
                  </label>
                  <p className="text-[11px] text-zinc-500">Tambahkan musisi, pembicara, atau guest star yang tampil.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddGuestStar}
                  className="px-3 py-1.5 rounded-xl bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-100 text-xs font-bold transition flex items-center gap-1 tactile-btn"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Guest Star
                </button>
              </div>

              {form.guest_stars.length === 0 ? (
                <div className="text-center py-4 text-xs text-zinc-400 border border-dashed border-zinc-200 rounded-xl bg-white">
                  Belum ada pengisi acara yang ditambahkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.guest_stars.map((g, idx) => (
                    <div key={idx} className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2 relative shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-zinc-800">Guest Star #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuestStar(idx)}
                          className="text-[11px] text-red-600 font-bold hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> Hapus
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Nama Artis / Tokoh</label>
                          <input
                            value={g.name}
                            onChange={(e) => handleUpdateGuestStar(idx, 'name', e.target.value)}
                            placeholder="Misal: Sheila on 7"
                            className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold focus:ring-1 focus:ring-zinc-950"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">Peran / Role</label>
                          <input
                            value={g.role}
                            onChange={(e) => handleUpdateGuestStar(idx, 'role', e.target.value)}
                            placeholder="Main Performer"
                            className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold focus:ring-1 focus:ring-zinc-950"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">URL Foto Artis</label>
                          <input
                            value={g.photo_url}
                            onChange={(e) => handleUpdateGuestStar(idx, 'photo_url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-1.5 rounded-lg border border-zinc-200 bg-zinc-50 text-xs font-semibold focus:ring-1 focus:ring-zinc-950"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Tata Letak Area Penonton &amp; Panggung</label>
              <input
                value={form.venue_layout_info}
                onChange={(e) => set('venue_layout_info', e.target.value)}
                placeholder="Panggung di titik Utara. VIP jarak 0-10m, CAT 1 10-25m, Festival di belakang."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">URL Banner Gambar Event</label>
              <input
                value={form.banner_url}
                onChange={(e) => set('banner_url', e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">Deskripsi Event</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Deskripsi lengkap mengenai event Anda..."
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors tactile-btn"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 shadow-xs transition-colors flex items-center justify-center gap-2 tactile-btn disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
