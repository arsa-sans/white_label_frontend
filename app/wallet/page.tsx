'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Nfc, RefreshCw, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

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
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(100000);
  const [topupLoading, setTopupLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cashless/wallet');
      if (res.data.success) {
        setWallet(res.data.data.wallet);
        setTransactions(res.data.data.transactions);
      }
    } catch (err) {
      console.error('Failed to load wallet', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    if (!topupAmount || topupAmount < 10000) {
      setErrorMsg('Minimum top-up adalah Rp 10.000');
      return;
    }
    setTopupLoading(true);
    setErrorMsg('');
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
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <Wallet className="w-6 h-6 text-indigo-600" />
          Dompet Cashless Event
        </h1>
        <p className="text-xs text-zinc-500 mt-1">
          Tap NFC Wristband atau QR Wallet di booth vendor — transaksi tanpa uang tunai.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-400 animate-pulse text-sm">Memuat data dompet...</div>
      ) : (
        <>
          {/* Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-cyan-900 rounded-3xl p-8 text-white shadow-2xl shadow-indigo-900/30">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-24 -translate-y-24" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-400/10 rounded-full -translate-x-8 translate-y-8" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-widest text-indigo-300">Total Saldo Tersedia</span>
                  <div className="text-4xl font-black mt-1">
                    Rp {wallet?.balance?.toLocaleString('id-ID') ?? '0'}
                  </div>
                </div>
                <button
                  onClick={fetchWallet}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                  title="Refresh saldo"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {wallet?.nfc_uid && (
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-xl border border-white/20 text-xs font-bold">
                  <Nfc className="w-4 h-4 text-cyan-300" />
                  NFC Wristband ID: <span className="font-mono text-cyan-300">{wallet.nfc_uid}</span>
                </div>
              )}

              <button
                onClick={() => setTopupOpen(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-indigo-800 font-extrabold text-sm shadow-lg hover:bg-indigo-50 transition-all"
              >
                <Plus className="w-4 h-4" />
                Top-Up Dompet
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                Total Top-Up
              </div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Rp {transactions
                  .filter((t) => t.type === 'topup')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('id-ID')}
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-1">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                Total Pengeluaran
              </div>
              <div className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                Rp {transactions
                  .filter((t) => t.type === 'payment')
                  .reduce((sum, t) => sum + t.amount, 0)
                  .toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Riwayat Transaksi
            </h2>

            {transactions.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-400">Belum ada riwayat transaksi dompet.</div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl ${
                          tx.type === 'topup'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : tx.type === 'refund'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {tx.type === 'topup' ? (
                          <ArrowUpCircle className="w-4 h-4" />
                        ) : (
                          <ArrowDownCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {tx.description}
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(tx.created_at).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-extrabold ${
                        tx.type === 'topup' || tx.type === 'refund'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400'
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Top-Up Dompet Cashless
              </h2>
              <button onClick={() => setTopupOpen(false)} className="text-zinc-400 hover:text-zinc-600 font-bold">
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
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  Rp {amount.toLocaleString('id-ID')}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                Atau masukkan nominal kustom:
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-500">Rp</span>
                <input
                  type="number"
                  value={topupAmount}
                  min={10000}
                  step={10000}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleTopup}
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
