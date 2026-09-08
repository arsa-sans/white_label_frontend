'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Plus, Trash2, ShieldCheck, CreditCard } from 'lucide-react';
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
      setErrorMsg('Nama akun dan nomor/ID e-wallet wajib diisi.');
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
      setErrorMsg(err.response?.data?.message || 'Gagal menambahkan metode pembayaran.');
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
    gopay: { label: 'GoPay', color: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
    dana: { label: 'DANA', color: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
    ovo: { label: 'OVO', color: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
    bank: { label: 'Bank Transfer', color: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
    bank_transfer: { label: 'Bank Transfer', color: 'bg-zinc-100 text-zinc-900 border-zinc-200' },
    other: { label: 'Lainnya', color: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2 tracking-tight">
            <Wallet className="w-6 h-6 text-zinc-900" />
            Metode Pembayaran E-Wallet
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Simpan informasi e-wallet untuk kemudahan proses checkout tiket event.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs shadow-xs hover:bg-zinc-800 transition-all tactile-btn"
        >
          <Plus className="w-4 h-4" />
          Tambah E-Wallet
        </button>
      </div>

      {/* Payment Security Banner */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 flex items-center gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-zinc-900 shrink-0" />
        <div className="text-xs text-zinc-600 font-medium">
          Informasi akun disimpan secara terenkripsi sebagai pilihan pembayaran instan. Tidak ada saldo top-up yang disimpan di server.
        </div>
      </div>

      {/* Methods List */}
      {loading ? (
        <div className="text-center py-16 text-zinc-400 text-xs animate-pulse font-medium">
          Memuat daftar metode pembayaran...
        </div>
      ) : methods.length === 0 ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center space-y-3 shadow-2xs">
          <CreditCard className="w-10 h-10 text-zinc-300 mx-auto" />
          <h3 className="text-sm font-extrabold text-zinc-950">Belum Ada E-Wallet Tersimpan</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Tambahkan akun GoPay, DANA, OVO, atau Bank untuk memudahkan proses reservasi tiket.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 tactile-btn"
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
                className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-center justify-between shadow-2xs hover:border-zinc-300 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-black ${badge.color}`}>
                    {badge.label}
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-zinc-950 block">{pm.account_name}</span>
                    <span className="text-xs text-zinc-400 font-mono font-medium">{pm.account_number}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(pm.id)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors tactile-btn"
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
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-zinc-900" />
                Tambah E-Wallet / Bank
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-700 font-bold text-sm">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddMethod} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Tipe Pembayaran</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                >
                  <option value="gopay">GoPay</option>
                  <option value="dana">DANA</option>
                  <option value="ovo">OVO</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama Pemilik Akun</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Budi Santoso"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nomor HP / Rekening</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 shadow-xs transition-all mt-2 tactile-btn disabled:opacity-50"
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
