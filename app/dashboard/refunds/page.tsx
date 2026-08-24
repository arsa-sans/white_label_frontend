'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRightLeft,
  Search,
  Loader2,
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
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Menunggu
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Disetujui
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
            <XCircle className="w-3 h-3" /> Ditolak
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner message="Memuat antrean refund..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Manajemen Refund & Reschedule
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tinjau dan proses permohonan pengembalian dana atau pindah jadwal dari pembeli.
          </p>
        </div>

        <button
          onClick={fetchRefunds}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'all' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
          <p className="text-2xl font-extrabold text-slate-900">{refunds.length}</p>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[10px] font-bold text-amber-500 uppercase">Menunggu</p>
          <p className="text-2xl font-extrabold text-amber-600">{pendingCount}</p>
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[10px] font-bold text-emerald-500 uppercase">Disetujui</p>
          <p className="text-2xl font-extrabold text-emerald-600">{approvedCount}</p>
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`p-4 rounded-2xl border text-left transition ${
            filter === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <p className="text-[10px] font-bold text-red-500 uppercase">Ditolak</p>
          <p className="text-2xl font-extrabold text-red-600">{rejectedCount}</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari berdasarkan Order ID, Ticket ID, atau alasan..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder:text-slate-400"
        />
      </div>

      {/* Refund List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Tidak Ada Permohonan"
          description="Belum ada permohonan refund atau reschedule yang sesuai filter."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((refund) => (
            <div
              key={refund.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                {/* Left: Info */}
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    {statusBadge(refund.status)}
                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        refund.type === 'refund'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200'
                      }`}
                    >
                      {refund.type === 'refund' ? (
                        <><RefreshCw className="w-3 h-3" /> Refund</>
                      ) : (
                        <><ArrowRightLeft className="w-3 h-3" /> Reschedule</>
                      )}
                    </span>
                    {refund.refund_amount && (
                      <span className="text-xs font-bold text-indigo-600">
                        Rp {refund.refund_amount.toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-800 font-medium">
                    <span className="text-slate-400 text-xs">Alasan:</span>{' '}
                    {refund.reason}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[10px] font-bold text-slate-400 uppercase">
                    <span>Order: <span className="font-mono text-slate-600">{refund.order_id}</span></span>
                    {refund.ticket_id && (
                      <span>Tiket: <span className="font-mono text-slate-600">{refund.ticket_id}</span></span>
                    )}
                    <span>
                      Diajukan: <span className="text-slate-600">{new Date(refund.created_at).toLocaleString('id-ID')}</span>
                    </span>
                  </div>

                  {refund.admin_notes && (
                    <div className="bg-slate-50 rounded-xl px-3 py-2 mt-2 text-xs text-slate-600 border border-slate-100">
                      <span className="font-bold text-slate-400">Catatan Admin:</span> {refund.admin_notes}
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                {refund.status === 'pending' && (
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {reviewingId === refund.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Catatan admin (opsional)..."
                          rows={2}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs resize-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReview(refund.id, 'approved')}
                            disabled={processingId === refund.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50"
                          >
                            {processingId === refund.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            Setujui & Refund
                          </button>
                          <button
                            onClick={() => handleReview(refund.id, 'rejected')}
                            disabled={processingId === refund.id}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition disabled:opacity-50"
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
                          className="text-[10px] text-slate-400 hover:text-slate-600 transition font-medium"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReviewingId(refund.id)}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
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
