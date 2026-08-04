'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Nfc, RefreshCw, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import { useConfirm } from '@/hooks/useConfirm';
import { segmentConfirmTemplates } from '@/lib/confirmPresets';

interface WalletData {
  id: string;
  user_id: string;
  balance: number;
  nfc_uid?: string;
}

interface WalletTx {
  id: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  description: string;
  created_at: string;
}

export default function WalletPage() {
  const { user } = useAppStore();
  const confirm = useConfirm();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(100000);
  const [topupLoading, setTopupLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchWallet();
    // Auto-refresh wallet data every 10 seconds
    const interval = setInterval(() => {
      fetchWallet(true);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchWallet = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await api.get('/cashless/wallet');
      if (res.data.success) {
        setWallet(res.data.data.wallet);
        setTransactions(res.data.data.transactions);
      }
    } catch (err: any) {
      if (!isBackground) {
        setErrorMsg('Gagal memuat data dompet. Pastikan Anda telah Sign In.');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleTopupClick = async () => {
    if (!topupAmount || topupAmount < 10000) {
      setErrorMsg('Minimum top-up adalah Rp 10.000');
      return;
    }
    setErrorMsg('');

    const isConfirmed = await segmentConfirmTemplates.topup(confirm, topupAmount);
    if (!isConfirmed) return;

    setTopupLoading(true);
    try {
      const res = await api.post('/cashless/topup', { amount: topupAmount });
      if (res.data.success) {
        setWallet(res.data.data.wallet);
        setTransactions((prev) => [res.data.data.transaction, ...prev]);
        setTopupOpen(false);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Top-up gagal. Coba lagi.');
    } finally {
      setTopupLoading(false);
    }
  };

  const TOPUP_PRESETS = [50000, 100000, 200000, 500000];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-indigo-600" />
          Dompet Cashless Event
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Tap NFC Wristband atau QR Wallet di booth vendor — transaksi tanpa uang tunai.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 animate-pulse text-sm font-medium">Memuat data dompet...</div>
      ) : (
        <>
          {/* Balance Card — Luminous Vibrant Light Gradient Banner */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-cyan-600 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-600/20 border border-indigo-400/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-24 -translate-y-24" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-300/20 rounded-full -translate-x-8 translate-y-8" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-100">Total Saldo Tersedia</span>
                  <div className="text-4xl font-black mt-1 drop-shadow-sm">
                    Rp {wallet?.balance?.toLocaleString('id-ID') ?? '0'}
                  </div>
                </div>
                <button
                  onClick={() => fetchWallet(false)}
                  className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition-colors border border-white/20"
                  title="Refresh saldo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {wallet?.nfc_uid && (
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 text-xs font-bold shadow-xs">
                  <Nfc className="w-4 h-4 text-cyan-200" />
                  NFC Wristband ID: <span className="font-mono text-cyan-200">{wallet.nfc_uid}</span>
                </div>
              )}

              <button
                onClick={() => setTopupOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-900 font-extrabold text-sm shadow-xl hover:bg-indigo-50 transition-all"
              >
                <Plus className="w-4 h-4 text-indigo-700" />
                Top-Up Dompet
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                Total Top-Up
              </div>
              <div className="text-lg font-black text-slate-900">
                Rp {transactions
                  .filter((t) => t.type === 'topup')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('id-ID')}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-1 shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <ArrowDownCircle className="w-4 h-4 text-red-600" />
                Total Pengeluaran
              </div>
              <div className="text-lg font-black text-slate-900">
                Rp {transactions
                  .filter((t) => t.type === 'payment')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Riwayat Transaksi
            </h2>

            {transactions.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Belum ada riwayat transaksi dompet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          tx.type === 'topup'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : tx.type === 'refund'
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : 'bg-red-50 text-red-700 border border-red-100'
                        }`}
                      >
                        {tx.type === 'topup' ? (
                          <ArrowUpCircle className="w-4 h-4" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          {tx.description}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(tx.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-extrabold ${
                        tx.type === 'topup' || tx.type === 'refund'
                          ? 'text-emerald-700'
                          : 'text-red-600'
                      }`}
                    >
                      {tx.type === 'topup' || tx.type === 'refund' ? '+' : '-'}
                      Rp {tx.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Top-Up Modal */}
      {topupOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Top-Up Dompet Cashless
              </h2>
              <button onClick={() => setTopupOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            {/* Quick Amount Presets */}
            <div className="grid grid-cols-2 gap-2">
              {TOPUP_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopupAmount(amount)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    topupAmount === amount
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  Rp {amount.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Atau masukkan nominal kustom:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-500">Rp</span>
                <input
                  type="number"
                  value={topupAmount}
                  min={10000}
                  step={10000}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleTopupClick}
              disabled={topupLoading}
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all"
            >
              {topupLoading ? 'Memproses Top-Up...' : `Top-Up Rp ${topupAmount.toLocaleString('id-ID')}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
