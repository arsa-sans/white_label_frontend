'use client';

/**
 * app/dashboard/payouts/page.tsx
 *
 * FASE 11 — Request Payout & Settlement History
 *
 * Features:
 *   - Overview revenue vs withdrawable balance
 *   - Submit Payout Request Modal (Bank selection, account details, amount validation)
 *   - Payout settlement history table (status: requested → approved → paid)
 *   - Admin status update actions (for demo testing)
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CircleDollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Banknote,
  ShieldCheck,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface PayoutRequest {
  id: string;
  tenant_id: string;
  organizer_id: string;
  event_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  status: 'requested' | 'approved' | 'paid' | 'rejected';
  requested_at: string;
  processed_at?: string;
}

const BANKS = [
  { code: 'BCA', name: 'Bank Central Asia (BCA)' },
  { code: 'Mandiri', name: 'Bank Mandiri' },
  { code: 'BNI', name: 'Bank Negara Indonesia (BNI)' },
  { code: 'BRI', name: 'Bank Rakyat Indonesia (BRI)' },
  { code: 'CIMB', name: 'CIMB Niaga' },
];

export default function PayoutsPage() {
  const { user } = useAppStore();
  const router = useRouter();

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    amount: '',
    bank_name: 'BCA',
    account_number: '',
    account_holder: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, payRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/analytics/payouts'),
      ]);

      if (dashRes.data.success) {
        setTotalRevenue(dashRes.data.data.total_revenue || 0);
      }

      if (payRes.data.success) {
        setPayouts(payRes.data.data);
      }
    } catch {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate withdrawable balance
  const alreadyRequested = payouts
    .filter((p) => p.status === 'requested' || p.status === 'approved' || p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const withdrawableBalance = Math.max(totalRevenue - alreadyRequested, 0);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(form.amount);

    if (!numAmount || numAmount <= 0) {
      setToast({ msg: 'Masukkan nominal pencairan yang valid.', type: 'error' });
      return;
    }

    if (numAmount > withdrawableBalance) {
      setToast({ msg: 'Nominal pencairan melebihi saldo yang tersedia.', type: 'error' });
      return;
    }

    if (!form.account_number || !form.account_holder) {
      setToast({ msg: 'Nomor dan nama pemilik rekening wajib diisi.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/analytics/payouts/request', {
        event_id: 'evt-001',
        amount: numAmount,
        bank_name: form.bank_name,
        account_number: form.account_number,
        account_holder: form.account_holder,
      });

      if (res.data.success) {
        setToast({ msg: 'Pengajuan pencairan dana berhasil dikirim.', type: 'success' });
        setShowModal(false);
        setForm({ amount: '', bank_name: 'BCA', account_number: '', account_holder: '' });
        loadData();
      }
    } catch (err: any) {
      setToast({ msg: err.response?.data?.message || 'Gagal mengirim pengajuan.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (payoutId: string, newStatus: 'approved' | 'paid' | 'rejected') => {
    try {
      const res = await api.put(`/analytics/payouts/${payoutId}/status`, { status: newStatus });
      if (res.data.success) {
        setToast({ msg: `Status pencairan diubah ke '${newStatus}'`, type: 'success' });
        loadData();
      }
    } catch {
      setToast({ msg: 'Gagal mengubah status.', type: 'error' });
    }
  };

  const isAdmin = (user?.role as string) === 'admin' || (user?.role as string) === 'superadmin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border text-xs font-bold animate-in slide-in-from-top-2 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-800">Pencairan Dana (Payout)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Banknote className="w-6 h-6 text-indigo-600" />
            Pencairan Dana &amp; Settlement Organizer
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pengajuan withdraw hasil penjualan tiket ke rekening bank resmi organizer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajukan Pencairan Dana
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-6 text-white space-y-3 shadow-lg shadow-indigo-600/20">
          <div className="flex items-center justify-between opacity-80 text-xs font-bold uppercase tracking-wider">
            <span>Saldo Siap Dicairkan</span>
            <CircleDollarSign className="w-5 h-5" />
          </div>
          <div className="text-3xl font-black">
            Rp {withdrawableBalance.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] opacity-80 font-medium">
            Total Revenue Ticket Sales dikurangi pencairan sebelumnya.
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Gross Revenue</span>
            <Banknote className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Omset kotor dari order berstatus Paid</div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Pencairan Disetujui / Paid</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            Rp {alreadyRequested.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {payouts.length} total riwayat pengajuan settlement
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          Riwayat Pengajuan Settlement
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium animate-pulse">
            Memuat riwayat payout...
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs font-medium">
            Belum ada pengajuan pencairan dana.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3 pr-4">ID Request</th>
                  <th className="pb-3 pr-4">Nominal</th>
                  <th className="pb-3 pr-4">Rekening Tujuan</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Tanggal Pengajuan</th>
                  {isAdmin && <th className="pb-3 text-right">Aksi Admin</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 pr-4 font-mono font-bold text-slate-800">{p.id}</td>
                    <td className="py-3.5 pr-4 font-black text-slate-900 text-sm">
                      Rp {p.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="font-bold text-slate-800 block">
                        {p.bank_name} - {p.account_number}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">a.n. {p.account_holder}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          p.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : p.status === 'approved'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : p.status === 'requested'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-500 font-medium">
                      {new Date(p.requested_at).toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>

                    {isAdmin && (
                      <td className="py-3.5 text-right space-x-1">
                        {p.status === 'requested' && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'approved')}
                            className="px-2 py-1 rounded bg-blue-100 text-blue-800 text-[10px] font-bold hover:bg-blue-200 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {(p.status === 'requested' || p.status === 'approved') && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, 'paid')}
                            className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold hover:bg-emerald-200 transition-colors"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900">Form Pengajuan Payout</h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-xs hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-xs space-y-1">
              <span className="block text-slate-500 font-medium">Maksimal Saldo Tersedia</span>
              <span className="text-sm font-black text-indigo-700">
                Rp {withdrawableBalance.toLocaleString('id-ID')}
              </span>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Pencairan (Rp) *</label>
                <input
                  type="number"
                  min="50000"
                  max={withdrawableBalance}
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="e.g. 50000000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Bank Tujuan *</label>
                <select
                  value={form.bank_name}
                  onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Rekening *</label>
                <input
                  type="text"
                  value={form.account_number}
                  onChange={(e) => setForm({ ...form, account_number: e.target.value })}
                  placeholder="e.g. 8820194821"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Rekening *</label>
                <input
                  type="text"
                  value={form.account_holder}
                  onChange={(e) => setForm({ ...form, account_holder: e.target.value })}
                  placeholder="e.g. PT Elena Media Utama"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || withdrawableBalance <= 0}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
