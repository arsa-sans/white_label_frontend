'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, RefreshCw, ShieldCheck, Clock, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

declare global {
  interface Window {
    snap?: any;
  }
}

interface WalletTx {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  description: string;
  created_at: string;
}

const PRESET_AMOUNTS = [50000, 100000, 200000, 500000];

export default function PaymentMethodsPage() {
  const { user } = useAppStore();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number>(100000);
  const [customAmount, setCustomAmount] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchWallet();
    loadSnapScript();
  }, []);

  const loadSnapScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== 'undefined' && window.snap) {
        resolve(true);
        return;
      }
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-5xCjb-Ee9PqxXyWI';
      const scriptId = 'midtrans-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
        script.setAttribute('data-client-key', clientKey);
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      } else {
        script.onload = () => resolve(true);
        if (window.snap) resolve(true);
      }
    });
  };

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cashless/wallet');
      if (res.data.success) {
        setBalance(res.data.data.wallet?.balance || 0);
        setTransactions(res.data.data.transactions || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const getTopupAmount = (): number => {
    if (useCustom) {
      const val = parseInt(customAmount.replace(/\D/g, ''), 10);
      return isNaN(val) ? 0 : val;
    }
    return selectedAmount;
  };

  const handleTopup = async () => {
    const amount = getTopupAmount();
    if (amount < 10000) {
      setErrorMsg('Minimal top-up Rp 10.000');
      return;
    }
    if (amount > 10000000) {
      setErrorMsg('Maksimal top-up Rp 10.000.000');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.post('/cashless/wallet/topup', { amount });
      if (!res.data.success) throw new Error(res.data.message);

      const { snap_token, topup_order } = res.data.data;
      const isRealSnap = snap_token && !snap_token.startsWith('sim-');

      await loadSnapScript();

      if (isRealSnap && window.snap) {
        window.snap.pay(snap_token, {
          onSuccess: async () => {
            await confirmAndRefresh(topup_order.id);
          },
          onPending: async () => {
            await confirmAndRefresh(topup_order.id);
          },
          onError: () => {
            setErrorMsg('Pembayaran gagal di Midtrans. Silakan coba lagi.');
            setSubmitting(false);
          },
          onClose: () => {
            setErrorMsg('Jendela Midtrans ditutup. Silakan coba lagi jika belum bayar.');
            setSubmitting(false);
          },
        });
      } else {
        // Simulation mode: confirm directly
        await confirmAndRefresh(topup_order.id);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'Gagal membuat top-up order.');
      setSubmitting(false);
    }
  };

  const confirmAndRefresh = async (topupOrderId: string) => {
    try {
      const confirmRes = await api.post('/cashless/wallet/topup/confirm', {
        topup_order_id: topupOrderId,
      });
      if (confirmRes.data.success) {
        setSuccessMsg(`Top-up berhasil! Saldo Anda telah bertambah.`);
        setTopupModalOpen(false);
        await fetchWallet();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Gagal konfirmasi top-up.');
    } finally {
      setSubmitting(false);
    }
  };

  const TX_ICONS: Record<string, React.ReactNode> = {
    topup: <ArrowUpCircle className="w-4 h-4 text-emerald-600" />,
    payment: <ArrowDownCircle className="w-4 h-4 text-red-500" />,
    refund: <RefreshCw className="w-4 h-4 text-blue-600" />,
  };

  const TX_COLORS: Record<string, string> = {
    topup: 'text-emerald-700',
    payment: 'text-red-600',
    refund: 'text-blue-700',
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2 tracking-tight">
          <Wallet className="w-6 h-6 text-zinc-900" />
          E-Wallet Saya
        </h1>
        <p className="text-xs text-zinc-500 font-medium mt-1">
          Kelola saldo dompet digital Anda untuk pembelian tiket dan transaksi di event.
        </p>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs font-bold text-emerald-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-zinc-950 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Saldo E-Wallet</p>
            <p className="text-3xl font-black font-mono mt-1">
              {loading ? (
                <span className="animate-pulse text-zinc-500">Rp ---</span>
              ) : (
                `Rp ${balance.toLocaleString('id-ID')}`
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setTopupModalOpen(true);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-100 transition-all tactile-btn shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Top Up Saldo
          </button>
        </div>
      </div>

      {/* Security Banner */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200 flex items-center gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-zinc-900 shrink-0" />
        <div className="text-xs text-zinc-600 font-medium">
          Saldo E-Wallet digunakan untuk pembelian tiket event dan akan menerima pengembalian dana (refund) otomatis.
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
          <Clock className="w-5 h-5 text-zinc-700" />
          Riwayat Transaksi
        </h2>

        {loading ? (
          <div className="text-center py-12 text-zinc-400 text-xs animate-pulse font-medium">
            Memuat riwayat transaksi...
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-3xl border border-zinc-200 p-8 text-center space-y-3 shadow-2xs">
            <Wallet className="w-10 h-10 text-zinc-300 mx-auto" />
            <h3 className="text-sm font-extrabold text-zinc-950">Belum Ada Transaksi</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Top up saldo Anda untuk mulai bertransaksi di event-event menarik.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {transactions
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-2xl border border-zinc-200 p-4 flex items-center justify-between shadow-2xs hover:border-zinc-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                      {TX_ICONS[tx.type] || <Wallet className="w-4 h-4 text-zinc-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-950 leading-snug">{tx.description}</p>
                      <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                        {new Date(tx.created_at).toLocaleString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-black font-mono ${
                      TX_COLORS[tx.type] || 'text-zinc-900'
                    }`}
                  >
                    {tx.type === 'payment' ? '-' : '+'} Rp {tx.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Top Up Modal */}
      {topupModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                <Plus className="w-5 h-5 text-zinc-900" />
                Top Up Saldo
              </h2>
              <button
                onClick={() => setTopupModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Current Balance */}
            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 text-center">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Saldo Saat Ini</p>
              <p className="text-xl font-black text-zinc-950 font-mono mt-1">
                Rp {balance.toLocaleString('id-ID')}
              </p>
            </div>

            {/* Preset Amounts */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                Pilih Nominal
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      setSelectedAmount(amt);
                      setUseCustom(false);
                    }}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all tactile-btn ${
                      !useCustom && selectedAmount === amt
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-zinc-300'
                    }`}
                  >
                    Rp {amt.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                Atau Nominal Lain
              </label>
              <input
                type="text"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setUseCustom(true);
                }}
                onFocus={() => setUseCustom(true)}
                placeholder="Contoh: 75000"
                className={`w-full px-3.5 py-2.5 rounded-xl border bg-zinc-50 text-xs font-bold text-zinc-900 font-mono focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition ${
                  useCustom ? 'border-zinc-950 ring-1 ring-zinc-950' : 'border-zinc-200'
                }`}
              />
            </div>

            {/* Amount Preview */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Nominal Top-Up</p>
              <p className="text-lg font-black text-emerald-800 font-mono">
                Rp {getTopupAmount().toLocaleString('id-ID')}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleTopup}
              disabled={submitting || getTopupAmount() < 10000}
              className="w-full py-3 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 shadow-xs transition-all tactile-btn disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                'Top Up via Midtrans'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
