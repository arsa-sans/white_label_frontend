'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Pencil, Trash2, Loader2, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react';
import api from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';
import { EventItem } from './EventFormModal';

export interface TicketTier {
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

export interface TierFormData {
  name: string;
  description: string;
  price: string;
  quota: string;
  color: string;
  sort_order: string;
}

const BLANK_TIER: TierFormData = {
  name: '',
  description: '',
  price: '',
  quota: '',
  color: '#09090b',
  sort_order: '1',
};

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

interface TicketTierDrawerProps {
  event: EventItem;
  onClose: () => void;
}

export default function TicketTierDrawer({ event, onClose }: TicketTierDrawerProps) {
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

  useEffect(() => {
    loadTiers();
  }, [loadTiers]);

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
      setToast({ msg: 'Gagal menghapus tier tiket.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[90vh]">
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

        {/* Header (Clean Bento Monochrome) */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-950">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">
                Pengelolaan Tier Tiket
              </h2>
              <p className="text-zinc-500 text-xs mt-0.5 font-medium truncate">{event.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Tier List */}
          {loading ? (
            <div className="text-center py-8 text-zinc-400 text-xs animate-pulse">Memuat tier tiket...</div>
          ) : (
            <div className="space-y-2">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-white transition-colors shadow-2xs"
                >
                  <div
                    className="w-4 h-4 rounded-full shrink-0 border border-zinc-300 shadow-2xs"
                    style={{ backgroundColor: tier.color || '#09090b' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-zinc-950">{tier.name}</span>
                      <span className="text-[10px] font-bold text-zinc-500 bg-zinc-200 px-2 py-0.5 rounded-md font-mono">
                        Terjual: {tier.sold} / Kuota: {tier.quota}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-xs text-zinc-500 truncate mt-0.5">{tier.description}</p>
                    )}
                    <span className="text-xs text-zinc-950 font-black mt-0.5 block font-mono">
                      Rp {tier.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() => handleStartEdit(tier)}
                      className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors tactile-btn"
                      title="Edit Tier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(tier.id, tier.name)}
                      className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors tactile-btn"
                      title="Hapus Tier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {tiers.length === 0 && (
                <div className="text-center py-6 text-zinc-400 text-xs">Belum ada tier tiket dibuat.</div>
              )}
            </div>
          )}

          {/* Tier Form */}
          <div className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-zinc-700" />
              {editingId ? 'Edit Tier Tiket' : 'Tambah Tier Tiket Baru'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama Tier</label>
                <input
                  value={form.name}
                  onChange={(e) => setF('name', e.target.value)}
                  placeholder="VIP Stage View (0-10m)"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Harga Tiket (Rp)</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setF('price', e.target.value)}
                  placeholder="1500000"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Kuota Tiket</label>
                <input
                  type="number"
                  min="1"
                  value={form.quota}
                  onChange={(e) => setF('quota', e.target.value)}
                  placeholder="200"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Warna Badge</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setF('color', e.target.value)}
                    className="w-10 h-8 rounded-lg border border-zinc-200 cursor-pointer bg-white"
                  />
                  <span className="text-xs font-mono font-semibold text-zinc-600">{form.color}</span>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Deskripsi Zona &amp; Fasilitas</label>
                <input
                  value={form.description}
                  onChange={(e) => setF('description', e.target.value)}
                  placeholder="Akses standing paling depan, fast-track gate, dan exclusive wristband."
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-zinc-200">
              {editingId && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-white transition-colors tactile-btn"
                >
                  Batal
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs tactile-btn disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Menyimpan...' : editingId ? 'Perbarui Tier Tiket' : 'Simpan Tier Tiket'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
