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
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 p-4 sm:p-6 md:p-10 w-full max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-9 h-9 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition tactile-btn"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
                <Tag className="w-6 h-6 text-zinc-900" />
                Manajemen Voucher &amp; Kode Promo
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                Kelola potongan harga, kuota flash sale, dan voucher diskon tiket event Anda
              </p>
            </div>
          </div>

          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold shadow-xs transition tactile-btn shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Kode Promo Baru</span>
          </button>
        </div>

        {/* Stats Row (Bento Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Voucher Aktif</span>
              <CheckCircle2 className="w-4 h-4 text-zinc-900" />
            </div>
            <div className="text-2xl font-black text-zinc-950 font-mono tabular-nums">
              {promos.filter((p) => p.is_active).length}
            </div>
            <div className="text-xs text-zinc-500">Siap digunakan di checkout</div>
          </div>

          <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Pemakaian</span>
              <Users className="w-4 h-4 text-zinc-900" />
            </div>
            <div className="text-2xl font-black text-zinc-950 font-mono tabular-nums">
              {promos.reduce((sum, p) => sum + p.used_count, 0)} kali
            </div>
            <div className="text-xs text-zinc-500">Klaim diskon oleh pembeli tiket</div>
          </div>

          <div className="bg-white border border-zinc-200 p-5 rounded-2xl shadow-xs space-y-1">
            <div className="flex items-center justify-between text-zinc-500 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Tipe Diskon Terbanyak</span>
              <Sparkles className="w-4 h-4 text-zinc-900" />
            </div>
            <div className="text-2xl font-black text-zinc-950">
              {promos.filter((p) => p.type === 'percentage').length >= promos.filter((p) => p.type === 'fixed').length
                ? 'Persentase (%)'
                : 'Nominal Tetap (Rp)'}
            </div>
            <div className="text-xs text-zinc-500">Strategi potongan harga</div>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Cari kode promo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 font-medium transition"
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
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition shadow-xs tactile-btn"
              >
                Buat Kode Promo
              </button>
            }
          />
        ) : (
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-700">
                <thead className="bg-zinc-50 border-b border-zinc-200 text-[11px] uppercase text-zinc-500 font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Kode Promo</th>
                    <th className="px-5 py-3.5">Tipe &amp; Nilai Diskon</th>
                    <th className="px-5 py-3.5">Target Event</th>
                    <th className="px-5 py-3.5">Kuota / Pemakaian</th>
                    <th className="px-5 py-3.5">Periode Berlaku</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {filteredPromos.map((p) => {
                    const targetEvent = events.find((e) => e.id === p.event_id);
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/80 transition">
                        <td className="px-5 py-4 font-mono font-bold text-zinc-950">
                          <span className="px-2.5 py-1 bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-lg text-xs">
                            {p.code}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-bold text-zinc-950 flex items-center gap-1.5 font-mono">
                            {p.type === 'percentage' ? (
                              <>
                                <Percent className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Diskon {p.value}%</span>
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-3.5 h-3.5 text-zinc-600" />
                                <span>Rp {p.value.toLocaleString('id-ID')}</span>
                              </>
                            )}
                          </div>
                          {p.min_purchase > 0 && (
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              Min. Rp {p.min_purchase.toLocaleString('id-ID')}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-zinc-600 text-xs">
                          {targetEvent ? (
                            <span className="font-semibold text-zinc-900">{targetEvent.name}</span>
                          ) : (
                            <span className="text-zinc-400">Semua Event</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs font-mono">
                            <span className="font-bold text-zinc-950">{p.used_count}</span>
                            <span className="text-zinc-400"> / {p.max_uses ?? '∞'}</span>
                          </div>
                          {p.max_uses && (
                            <div className="w-24 bg-zinc-100 rounded-full h-1.5 mt-1.5 overflow-hidden border border-zinc-200">
                              <div
                                className="bg-zinc-900 h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, (p.used_count / p.max_uses) * 100)}%`,
                                }}
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-zinc-500 font-mono">
                          <div>{new Date(p.valid_from).toLocaleDateString('id-ID')}</div>
                          <div className="text-zinc-400">
                            s/d {new Date(p.valid_until).toLocaleDateString('id-ID')}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {p.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-900 border border-zinc-200">
                              <CheckCircle2 className="w-3 h-3 text-zinc-900" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-200">
                              <XCircle className="w-3 h-3" />
                              Nonaktif
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition"
                              title="Edit"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p)}
                              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
