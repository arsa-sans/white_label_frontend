'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
          <h2 className="text-lg font-black text-white">{isEdit ? '✏️ Edit Event' : '✨ Buat Event Baru'}</h2>
          <p className="text-indigo-200 text-xs mt-0.5 font-medium">
            {isEdit
              ? 'Update detail event Anda'
              : 'Isi form berikut untuk membuat event baru (tier tiket default akan dibuat otomatis)'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Event *</label>
              <input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Neon Genesis Music Festival 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Kategori</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as 'draft' | 'published')}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Lokasi *</label>
              <input
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="JIExpo Kemayoran, Jakarta"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Venue</label>
              <input
                value={form.venue_name}
                onChange={(e) => set('venue_name', e.target.value)}
                placeholder="Main Stage Arena A"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mulai Event *</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Selesai Event *</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1.5">⏰ Penjualan Tiket Dibuka</label>
              <input
                type="datetime-local"
                value={form.sale_start_at}
                onChange={(e) => set('sale_start_at', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-700 mb-1.5">⏰ Penjualan Tiket Ditutup</label>
              <input
                type="datetime-local"
                value={form.sale_end_at}
                onChange={(e) => set('sale_end_at', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Google Maps Link */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">📍 Link Google Maps (Peta Lokasi Event)</label>
              <input
                value={form.venue_map_url}
                onChange={(e) => set('venue_map_url', e.target.value)}
                placeholder="https://maps.google.com/?q=-6.1492,106.8455 atau link embed Google Maps"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Link ini akan ditampilkan di halaman detail event sebagai peta interaktif dan navigasi pengunjung.
              </p>
            </div>

            {/* Guest Stars Section */}
            <div className="sm:col-span-2 border border-slate-200 bg-slate-50/60 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800">⭐ Bintang Tamu / Guest Stars</label>
                  <p className="text-[11px] text-slate-500">Tambahkan artis, pengisi acara, atau pembicara yang tampil.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddGuestStar}
                  className="px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold transition"
                >
                  + Tambah Bintang Tamu
                </button>
              </div>

              {form.guest_stars.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white">
                  Belum ada bintang tamu ditambahkan. Klik tombol di atas untuk menambahkan.
                </div>
              ) : (
                <div className="space-y-3">
                  {form.guest_stars.map((g, idx) => (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-indigo-600">Bintang Tamu #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveGuestStar(idx)}
                          className="text-[11px] text-red-600 font-bold hover:text-red-800"
                        >
                          Hapus
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Nama Artis / Tokoh</label>
                          <input
                            value={g.name}
                            onChange={(e) => handleUpdateGuestStar(idx, 'name', e.target.value)}
                            placeholder="Misal: Sheila on 7"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Role / Peran</label>
                          <input
                            value={g.role}
                            onChange={(e) => handleUpdateGuestStar(idx, 'role', e.target.value)}
                            placeholder="Main Performer, DJ, etc."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">URL Foto Bintang Tamu</label>
                          <input
                            value={g.photo_url}
                            onChange={(e) => handleUpdateGuestStar(idx, 'photo_url', e.target.value)}
                            placeholder="https://images.unsplash.com/..."
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tata Letak Area Penonton &amp; Panggung</label>
              <input
                value={form.venue_layout_info}
                onChange={(e) => set('venue_layout_info', e.target.value)}
                placeholder="Misal: Panggung di titik Utara. VIP jarak 0-10m, CAT 1 10-25m, Festival di belakang."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Banner URL</label>
              <input
                value={form.banner_url}
                onChange={(e) => set('banner_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Deskripsi Event</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={3}
                placeholder="Deskripsi singkat event Anda..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-colors flex items-center justify-center gap-2"
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
