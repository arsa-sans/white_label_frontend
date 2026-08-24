'use client';

import React, { useState, useEffect } from 'react';
import { X, Tag, Calendar, Percent, DollarSign, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

export interface PromoItem {
  id: string;
  tenant_id: string;
  event_id?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_uses: number | null;
  used_count: number;
  min_purchase: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

export interface PromoFormData {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  max_uses: number | string;
  min_purchase: number;
  valid_from: string;
  valid_until: string;
  event_id?: string;
  is_active: boolean;
}

interface PromoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  promo?: PromoItem | null;
  events?: Array<{ id: string; name: string }>;
}

export default function PromoFormModal({
  isOpen,
  onClose,
  onSuccess,
  promo,
  events = [],
}: PromoFormModalProps) {
  const [formData, setFormData] = useState<PromoFormData>({
    code: '',
    type: 'percentage',
    value: 10,
    max_uses: 100,
    min_purchase: 0,
    valid_from: new Date().toISOString().slice(0, 16),
    valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
    event_id: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (promo) {
      setFormData({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        max_uses: promo.max_uses ?? '',
        min_purchase: promo.min_purchase,
        valid_from: promo.valid_from ? new Date(promo.valid_from).toISOString().slice(0, 16) : '',
        valid_until: promo.valid_until ? new Date(promo.valid_until).toISOString().slice(0, 16) : '',
        event_id: promo.event_id || '',
        is_active: promo.is_active,
      });
    } else {
      setFormData({
        code: '',
        type: 'percentage',
        value: 10,
        max_uses: 100,
        min_purchase: 0,
        valid_from: new Date().toISOString().slice(0, 16),
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 16),
        event_id: '',
        is_active: true,
      });
    }
    setErrorMsg('');
  }, [promo, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      setErrorMsg('Kode promo tidak boleh kosong.');
      return;
    }
    if (formData.value <= 0) {
      setErrorMsg('Nilai diskon harus lebih dari 0.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        type: formData.type,
        value: Number(formData.value),
        max_uses: formData.max_uses !== '' ? Number(formData.max_uses) : null,
        min_purchase: Number(formData.min_purchase) || 0,
        valid_from: new Date(formData.valid_from).toISOString(),
        valid_until: new Date(formData.valid_until).toISOString(),
        event_id: formData.event_id || undefined,
        is_active: formData.is_active,
      };

      if (promo?.id) {
        await api.put(`/promos/${promo.id}`, payload);
      } else {
        await api.post('/promos', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal menyimpan kode promo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {promo ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
              </h2>
              <p className="text-xs text-slate-400">Kelola voucher diskon untuk menarik lebih banyak pembeli tiket</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Code */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Kode Promo / Voucher *
            </label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="CONTOH: EARLYBIRD20"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tipe Diskon *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                {formData.type === 'percentage' ? 'Besar Diskon (%)' : 'Potongan (Rp)'} *
              </label>
              <div className="relative">
                {formData.type === 'percentage' ? (
                  <Percent className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                ) : (
                  <DollarSign className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                )}
                <input
                  type="number"
                  min="1"
                  max={formData.type === 'percentage' ? 100 : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Max Uses & Min Purchase */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Maksimal Kuota Pakai
              </label>
              <div className="relative">
                <Users className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited jika kosong"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Min. Pembelian (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_purchase}
                onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Valid Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Mulai Berlaku *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Berakhir Pada *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
          </div>

          {/* Event Filter */}
          {events.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Event (Opsional)
              </label>
              <select
                value={formData.event_id}
                onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              >
                <option value="">Semua Event di Tenant Ini</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Active Switch */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-slate-300 cursor-pointer">
              Aktifkan kode promo ini langsung
            </label>
          </div>

          {/* Footer actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{promo ? 'Simpan Perubahan' : 'Buat Kode Promo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
