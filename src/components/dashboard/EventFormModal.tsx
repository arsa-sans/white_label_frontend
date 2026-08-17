'use client';

import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export interface EventItem {
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
  start_date: string;
  end_date: string;
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
  start_date: '',
  end_date: '',
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
            {isEdit
              ? 'Update detail event Anda'
              : 'Isi form berikut untuk membuat event baru (tier tiket default akan dibuat otomatis)'}
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Mulai *</label>
              <input
                type="datetime-local"
                value={form.start_date}
                onChange={(e) => set('start_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Selesai *</label>
              <input
                type="datetime-local"
                value={form.end_date}
                onChange={(e) => set('end_date', e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
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

            <div>
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
