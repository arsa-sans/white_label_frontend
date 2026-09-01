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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-zinc-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-950">
                {promo ? 'Edit Kode Promo' : 'Buat Kode Promo Baru'}
              </h2>
              <p className="text-xs text-zinc-500">Kelola voucher diskon tiket event Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-950 p-2 rounded-xl hover:bg-zinc-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Code */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
              Kode Promo / Voucher *
            </label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="CONTOH: EARLYBIRD20"
                required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Type & Value */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Tipe Diskon *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition font-medium"
              >
                <option value="percentage">Persentase (%)</option>
                <option value="fixed">Nominal Tetap (Rp)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                {formData.type === 'percentage' ? 'Besar Diskon (%)' : 'Potongan (Rp)'} *
              </label>
              <div className="relative">
                {formData.type === 'percentage' ? (
                  <Percent className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                ) : (
                  <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                )}
                <input
                  type="number"
                  min="1"
                  max={formData.type === 'percentage' ? 100 : undefined}
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
                />
              </div>
            </div>
          </div>

          {/* Max Uses & Min Purchase */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Maksimal Kuota Pakai
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
                <input
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Min. Pembelian (Rp)
              </label>
              <input
                type="number"
                min="0"
                value={formData.min_purchase}
                onChange={(e) => setFormData({ ...formData, min_purchase: Number(e.target.value) })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Valid Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Mulai Berlaku *
              </label>
              <input
                type="datetime-local"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[11px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Berakhir Pada *
              </label>
              <input
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-[11px] text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Event Filter */}
          {events.length > 0 && (
            <div>
              <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Target Event (Opsional)
              </label>
              <select
                value={formData.event_id}
                onChange={(e) => setFormData({ ...formData, event_id: e.target.value })}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition font-medium"
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
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
            />
            <label htmlFor="is_active" className="text-xs font-semibold text-zinc-800 cursor-pointer">
              Aktifkan kode promo ini langsung
            </label>
          </div>

          {/* Footer actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition tactile-btn"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-2 tactile-btn"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{promo ? 'Simpan Perubahan' : 'Buat Kode Promo'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
