'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Plus, Trash2, ShieldCheck, CheckCircle2, CreditCard } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface PaymentMethod {
  id: string;
  user_id: string;
  type: 'dana' | 'gopay' | 'ovo' | 'bank' | 'bank_transfer' | 'other';
  account_name: string;
  account_number: string;
  is_default: boolean;
}

export default function PaymentMethodsPage() {
  const { user } = useAppStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [type, setType] = useState<string>('gopay');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cashless/payment-methods');
      if (res.data.success) {
        setMethods(res.data.data);
      }
    } catch {
      // Quiet UI handling
    } finally {
      setLoading(false);
    }
  };

  const handleAddMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName || !accountNumber) {
      setErrorMsg('Nama akun dan nomor/ID e-wallet wajib diisi');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/cashless/payment-methods', {
        type,
        account_name: accountName,
        account_number: accountNumber,
      });

      if (res.data.success) {
        setMethods((prev) => [...prev, res.data.data]);
        setModalOpen(false);
        setAccountName('');
        setAccountNumber('');
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal menambahkan metode pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await api.delete(`/cashless/payment-methods/${id}`);
      if (res.data.success) {
        setMethods((prev) => prev.filter((m) => m.id !== id));
      }
    } catch {
      // Quiet UI error handling
    }
  };

  const TYPE_LABELS: Record<string, { label: string; color: string }> = {
    gopay: { label: 'GoPay', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    dana: { label: 'DANA', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    ovo: { label: 'OVO', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    bank: { label: 'Bank Transfer', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    bank_transfer: { label: 'Bank Transfer', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    other: { label: 'Lainnya', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-indigo-600" />
            Metode Pembayaran E-Wallet
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Simpan informasi e-wallet favorit Anda untuk pembayaran cepat saat checkout tiket.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah E-Wallet
        </button>
      </div>

      {/* Payment Security Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 rounded-2xl p-4 border border-indigo-100 flex items-center gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0" />
        <div className="text-xs text-indigo-900 font-medium">
          Informasi metode pembayaran digunakan sebagai pilihan default checkout. Tidak ada saldo top-up yang disimpan di server.
        </div>
      </div>

      {/* Methods List */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse font-medium">
          Memuat daftar metode pembayaran...
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-3">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Belum Ada E-Wallet Tersimpan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Tambahkan akun GoPay, DANA, OVO, atau Bank untuk memudahkan proses beli tiket.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" />
            Tambah Sekarang
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((pm) => {
            const badge = TYPE_LABELS[pm.type] || TYPE_LABELS.other;
            return (
              <div
                key={pm.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center justify-between shadow-xs hover:border-indigo-200 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold ${badge.color}`}>
                    {badge.label}
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-slate-900 block">{pm.account_name}</span>
                    <span className="text-xs text-slate-400 font-mono font-medium">{pm.account_number}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(pm.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Hapus e-wallet"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add E-Wallet Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Tambah E-Wallet / Bank
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Pembayaran</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="gopay">GoPay</option>
                  <option value="dana">DANA</option>
                  <option value="ovo">OVO</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Pemilik Akun</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor HP / Rekening</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all mt-2"
              >
                {submitting ? 'Menyimpan...' : 'Simpan E-Wallet'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
