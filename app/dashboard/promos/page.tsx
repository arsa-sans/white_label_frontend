'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Percent,
  DollarSign,
  Users,
  Calendar,
  Sparkles,
  ArrowLeft,
  Search,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useConfirm } from '@/hooks/useConfirm';
import PromoFormModal, { PromoItem } from '@/components/dashboard/PromoFormModal';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

export default function PromosDashboardPage() {
  const confirm = useConfirm();
  const { user } = useAppStore();

  const [promos, setPromos] = useState<PromoItem[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState<PromoItem | null>(null);

  const fetchPromos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/promos');
      if (res.data.success) {
        setPromos(res.data.data);
      }

      const evRes = await api.get('/events');
      if (evRes.data.success) {
        setEvents(evRes.data.data.map((e: any) => ({ id: e.id, name: e.name })));
      }
    } catch (err) {
      console.error('Failed to fetch promos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCreateNew = () => {
    setSelectedPromo(null);
    setIsModalOpen(true);
  };

  const handleEdit = (promo: PromoItem) => {
    setSelectedPromo(promo);
    setIsModalOpen(true);
  };

  const handleDelete = async (promo: PromoItem) => {
    const isConfirmed = await confirm({
      segmentTag: 'MANAJEMEN PROMO',
      title: 'Hapus Kode Promo',
      message: `Apakah Anda yakin ingin menghapus kode promo "${promo.code}"? Tindakan ini tidak dapat dibatalkan.`,
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      variant: 'danger',
    });

    if (!isConfirmed) return;

    try {
      await api.delete(`/promos/${promo.id}`);
      fetchPromos();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus promo.');
    }
  };

  const filteredPromos = promos.filter(
    (p) =>
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                  <Tag className="w-7 h-7 text-purple-400" />
                  Manajemen Voucher & Kode Promo
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Kelola potongan harga, kuota flash sale, dan voucher diskon tiket event Anda
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/25 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kode Promo Baru</span>
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Voucher Aktif</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {promos.filter((p) => p.is_active).length}
            </div>
            <div className="text-xs text-slate-500 mt-1">Siap digunakan di checkout</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Pemakaian</span>
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-purple-400">
              {promos.reduce((sum, p) => sum + p.used_count, 0)} kali
            </div>
            <div className="text-xs text-slate-500 mt-1">Klaim diskon oleh pembeli tiket</div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tipe Diskon Terbanyak</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">
              {promos.filter((p) => p.type === 'percentage').length >= promos.filter((p) => p.type === 'fixed').length
                ? 'Persentase (%)'
                : 'Nominal Tetap (Rp)'}
            </div>
            <div className="text-xs text-slate-500 mt-1">Strategi potongan harga</div>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cari kode promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>
        </div>

        {/* Table / List */}
        {loading ? (
          <div className="py-20 flex justify-center">
            <LoadingSpinner message="Memuat daftar voucher..." />
          </div>
        ) : filteredPromos.length === 0 ? (
          <EmptyState
            icon={Tag}
            title="Belum Ada Kode Promo"
            description="Buat kode promo pertama Anda untuk menarik pembeli dan meningkatkan penjualan tiket!"
            action={
              <button
                onClick={handleCreateNew}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                Buat Kode Promo
              </button>
            }
          />
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-xs uppercase text-slate-400 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Kode Promo</th>
                    <th className="px-6 py-4">Tipe & Nilai Diskon</th>
                    <th className="px-6 py-4">Target Event</th>
                    <th className="px-6 py-4">Kuota / Pemakaian</th>
                    <th className="px-6 py-4">Periode Berlaku</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPromos.map((p) => {
                    const targetEvent = events.find((e) => e.id === p.event_id);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition">
                        <td className="px-6 py-4 font-mono font-bold text-white">
                          <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-lg">
                            {p.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {p.type === 'percentage' ? (
                              <>
                                <Percent className="w-4 h-4 text-purple-400" />
                                <span>Diskon {p.value}%</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <span>Rp {p.value.toLocaleString('id-ID')}</span>
                              </>
                            )}
                          </div>
                          {p.min_purchase > 0 && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              Min. Rp {p.min_purchase.toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {targetEvent ? (
                            <span className="text-indigo-400 font-medium">{targetEvent.name}</span>
                          ) : (
                            <span className="text-slate-500">Semua Event</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <span className="font-bold text-white">{p.used_count}</span>
                            <span className="text-slate-500"> / {p.max_uses ?? '∞'}</span>
                          </div>
                          {p.max_uses && (
                            <div className="w-24 bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                              <div
                                className="bg-purple-500 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, (p.used_count / p.max_uses) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          <div>{new Date(p.valid_from).toLocaleDateString('id-ID')}</div>
                          <div className="text-slate-500">
                            s/d {new Date(p.valid_until).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {p.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              <XCircle className="w-3 h-3" />
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Form Modal */}
        <PromoFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchPromos}
          promo={selectedPromo}
          events={events}
        />
      </div>
    </div>
  );
}
