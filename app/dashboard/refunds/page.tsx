'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRightLeft,
  Search,
  Loader2,
  Receipt,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';

interface RefundItem {
  id: string;
  order_id: string;
  user_id: string;
  ticket_id?: string;
  type: 'refund' | 'reschedule';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  refund_amount?: number;
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export default function RefundsPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace('/events');
      return;
    }
    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      router.replace('/events');
      return;
    }
    fetchRefunds();
  }, [user, token, router]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/refunds');
      if (res.data.success) {
        setRefunds(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    try {
      const res = await api.patch(`/refunds/${id}/review`, {
        status,
        admin_notes: adminNotes || undefined,
      });
      if (res.data.success) {
        setReviewingId(null);
        setAdminNotes('');
        fetchRefunds();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses review refund.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = refunds
    .filter((r) => filter === 'all' || r.status === filter)
    .filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.order_id.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.ticket_id && r.ticket_id.toLowerCase().includes(q))
      );
    });

  const pendingCount = refunds.filter((r) => r.status === 'pending').length;
  const approvedCount = refunds.filter((r) => r.status === 'approved').length;
  const rejectedCount = refunds.filter((r) => r.status === 'rejected').length;

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> Menunggu
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3 text-red-600" /> Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner message="Memuat antrean permohonan refund..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-xs font-bold text-zinc-800">Refund &amp; Reschedule</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2 tracking-tight">
            <Receipt className="w-6 h-6 text-zinc-900" />
            Manajemen Refund &amp; Reschedule
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Tinjau dan proses permohonan pengembalian dana tiket atau pemindahan jadwal festival.
          </p>
        </div>

        <button
          onClick={fetchRefunds}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs tactile-btn"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Data
        </button>
      </div>

      {/* Stats Cards (Bento Style) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-3xl border text-left transition tactile-btn ${
            filter === 'all'
              ? 'bg-zinc-950 text-white border-zinc-950 shadow-2xs'
              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs text-zinc-900'
          }`}
        >
          <p className={`text-[10px] font-bold uppercase tracking-wider ${filter === 'all' ? 'text-zinc-400' : 'text-zinc-400'}`}>Total Tiket</p>
          <p className="text-2xl font-black font-mono">{refunds.length}</p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-3xl border text-left transition tactile-btn ${
            filter === 'pending'
              ? 'bg-amber-50 border-amber-300 shadow-2xs'
              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
          }`}
        >
          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Menunggu</p>
          <p className="text-2xl font-black text-amber-800 font-mono">{pendingCount}</p>
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`p-4 rounded-3xl border text-left transition tactile-btn ${
            filter === 'approved'
              ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
          }`}
        >
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Disetujui</p>
          <p className="text-2xl font-black text-emerald-800 font-mono">{approvedCount}</p>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`p-4 rounded-3xl border text-left transition tactile-btn ${
            filter === 'rejected'
              ? 'bg-red-50 border-red-300 shadow-2xs'
              : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
          }`}
        >
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider">Ditolak</p>
          <p className="text-2xl font-black text-red-700 font-mono">{rejectedCount}</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan Order ID, Ticket ID, atau alasan refund..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white shadow-2xs"
        />
      </div>

      {/* Refund List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Tidak Ada Permohonan"
          description="Belum ada permohonan refund atau reschedule yang cocok dengan filter saat ini."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((refund) => (
            <div
              key={refund.id}
              className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xs hover:shadow-xs transition"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                {/* Left: Info */}
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(refund.status)}
                    <span
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        refund.type === 'refund'
                          ? 'bg-zinc-100 text-zinc-900 border-zinc-300'
                          : 'bg-zinc-100 text-zinc-900 border-zinc-300'
                      }`}
                    >
                      {refund.type === 'refund' ? (
                        <><RefreshCw className="w-3 h-3 text-zinc-600" /> Refund</>
                      ) : (
                        <><ArrowRightLeft className="w-3 h-3 text-zinc-600" /> Reschedule</>
                      )}
                    </span>
                    {refund.refund_amount && (
                      <span className="text-xs font-black text-zinc-950 font-mono">
                        Rp {refund.refund_amount.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-900 font-semibold leading-relaxed">
                    <span className="text-zinc-400 font-bold uppercase text-[10px] block">Alasan Pengajuan:</span>
                    {refund.reason}
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-zinc-100">
                    <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Order ID</span>
                      <span className="font-mono text-zinc-900 font-bold">{refund.order_id}</span>
                    </div>
                    {refund.ticket_id && (
                      <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                        <span className="text-[10px] uppercase font-bold text-zinc-400 block">Tiket ID</span>
                        <span className="font-mono text-zinc-900 font-bold">{refund.ticket_id}</span>
                      </div>
                    )}
                    <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Waktu Pengajuan</span>
                      <span className="font-mono text-zinc-700 text-[11px] font-semibold">
                        {new Date(refund.created_at).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {refund.admin_notes && (
                    <div className="bg-zinc-50 rounded-xl p-3 text-xs text-zinc-700 border border-zinc-200">
                      <span className="font-bold text-zinc-400 text-[10px] uppercase block mb-0.5">Catatan Evaluasi:</span>
                      {refund.admin_notes}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                {refund.status === 'pending' && (
                  <div className="flex flex-col gap-2 min-w-[220px] justify-center">
                    {reviewingId === refund.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Catatan verifikasi (opsional)..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(refund.id, 'approved')}
                            disabled={processingId === refund.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-50 tactile-btn shadow-xs"
                          >
                            {processingId === refund.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Setujui
                          </button>
                          <button
                            onClick={() => handleReview(refund.id, 'rejected')}
                            disabled={processingId === refund.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition disabled:opacity-50 tactile-btn shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Tolak
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setReviewingId(null);
                            setAdminNotes('');
                          }}
                          className="text-[10px] text-zinc-400 hover:text-zinc-700 transition font-bold block text-center w-full"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(refund.id)}
                        className="px-4 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-xs tactile-btn"
                      >
                        Tinjau Permohonan
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
