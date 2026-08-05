'use client';

/**
 * app/booth/page.tsx
 *
 * FASE 11 — Vendor Booth Cashier Web App (Fallback UI)
 *
 * Sesuai spec:
 *   - Kasir vendor F&B / Merchandise venue.
 *   - Tap NFC Wristband / Input Wallet Code.
 *   - Idempotent debit per transaksi via UUID v4 reference_id (SKILLS.md § Skill 6).
 *   - Visual feedback success / error + saldo sisa pengunjung.
 *   - Riwayat transaksi booth sesi hari ini.
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Store,
  CreditCard,
  CheckCircle2,
  XCircle,
  Smartphone,
  RefreshCw,
  Clock,
  ArrowLeft,
  Banknote,
  Receipt,
  Delete,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import api from '@/lib/api';

const PRESETS = [15000, 25000, 35000, 50000, 75000, 100000];

interface BoothTx {
  id: string;
  amount: number;
  nfc_uid: string;
  items_summary: string;
  time: string;
  status: 'success' | 'failed';
  remaining_balance?: number;
}

export default function BoothCashierPage() {
  const router = useRouter();

  const [boothName, setBoothName] = useState('Kopi Kenangan Booth #1');
  const [amountStr, setAmountStr] = useState('0');
  const [itemsSummary, setItemsSummary] = useState('');
  const [nfcInput, setNfcInput] = useState('NFC-994821'); // Pre-filled for easy testing

  const [loading, setLoading] = useState(false);
  const [resultModal, setResultModal] = useState<{
    status: 'success' | 'failed';
    title: string;
    message: string;
    amount: number;
    remaining_balance?: number;
  } | null>(null);

  const [todayTxs, setTodayTxs] = useState<BoothTx[]>([
    {
      id: 'ref-demo-01',
      amount: 45000,
      nfc_uid: 'NFC-994821',
      items_summary: '2x Ice Latte',
      time: '10 min ago',
      status: 'success',
      remaining_balance: 405000,
    },
  ]);

  const numericAmount = parseInt(amountStr, 10) || 0;

  const handleNumpad = (val: string) => {
    if (val === 'C') {
      setAmountStr('0');
      return;
    }
    if (val === 'DEL') {
      setAmountStr((prev) => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      return;
    }
    setAmountStr((prev) => (prev === '0' ? val : prev + val));
  };

  const handleAddPreset = (val: number) => {
    setAmountStr((prev) => String((parseInt(prev, 10) || 0) + val));
  };

  const handleCharge = async () => {
    if (numericAmount <= 0) return;
    if (!nfcInput) {
      alert('Masukkan NFC UID Wristband pengunjung.');
      return;
    }

    setLoading(true);
    const referenceId = `ref-${Date.now()}-${Math.floor(Math.random() * 8999 + 1000)}`;

    try {
      const res = await api.post('/cashless/booth/debit', {
        amount: numericAmount,
        nfc_uid: nfcInput,
        reference_id: referenceId,
        booth_name: boothName,
        items_summary: itemsSummary || 'Booth Transaction',
      });

      if (res.data.success) {
        const data = res.data.data;
        const remaining = data.remaining_balance ?? data.wallet?.balance ?? 0;

        setResultModal({
          status: 'success',
          title: 'TRANSAKSI BERHASIL! 🟢',
          message: `Pembayaran Rp ${numericAmount.toLocaleString('id-ID')} diterima.`,
          amount: numericAmount,
          remaining_balance: remaining,
        });

        // Add to history
        setTodayTxs([
          {
            id: referenceId,
            amount: numericAmount,
            nfc_uid: nfcInput,
            items_summary: itemsSummary || 'Booth Transaction',
            time: 'Baru saja',
            status: 'success',
            remaining_balance: remaining,
          },
          ...todayTxs,
        ]);

        // Reset amount
        setAmountStr('0');
        setItemsSummary('');
      } else {
        throw new Error(res.data.message || 'Debit gagal');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Transaksi gagal diproses.';
      setResultModal({
        status: 'failed',
        title: 'TRANSAKSI GAGAL! 🔴',
        message: msg,
        amount: numericAmount,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalSalesToday = todayTxs
    .filter((t) => t.status === 'success')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="bg-slate-800/80 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl bg-slate-700 text-slate-300 hover:text-white hover:bg-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white">{boothName}</h1>
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Kasir Booth Cashless Online
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Omset Hari Ini
          </span>
          <span className="text-base font-black text-emerald-400">
            Rp {totalSalesToday.toLocaleString('id-ID')}
          </span>
        </div>
      </header>

      {/* Main Cashier Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Charge Calculator & Numpad */}
        <div className="lg:col-span-7 bg-slate-800 border border-slate-700/80 rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Display Amount */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 text-right space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Total Tagihan
              </span>
              <div className="text-4xl font-black text-emerald-400 font-mono tracking-tight">
                Rp {numericAmount.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Item summary note & NFC Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Wristband NFC UID
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={nfcInput}
                    onChange={(e) => setNfcInput(e.target.value.toUpperCase())}
                    placeholder="Tap NFC / Input Code"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Catatan Item (opsional)
                </label>
                <input
                  type="text"
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  placeholder="e.g. 2x Kopi Kenangan"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                + Preset Cepat
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAddPreset(preset)}
                    className="py-2 rounded-xl bg-slate-700/60 border border-slate-600/60 text-xs font-bold text-slate-200 hover:bg-indigo-600 hover:border-indigo-500 transition-colors"
                  >
                    +{(preset / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Numpad Grid */}
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'].map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleNumpad(btn)}
                  className={`py-3.5 rounded-2xl text-lg font-black transition-all ${
                    btn === 'C'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                      : btn === 'DEL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 flex items-center justify-center'
                      : 'bg-slate-700/80 text-white border border-slate-600/80 hover:bg-slate-600'
                  }`}
                >
                  {btn === 'DEL' ? <Delete className="w-5 h-5" /> : btn}
                </button>
              ))}
            </div>

            {/* Charge Button */}
            <button
              onClick={handleCharge}
              disabled={loading || numericAmount <= 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-base shadow-lg shadow-emerald-500/20 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? (
                'Memproses Transaksi Tap...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  BAYAR SALDO WRISTBAND (Rp {numericAmount.toLocaleString('id-ID')})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Sales History Log */}
        <div className="lg:col-span-5 bg-slate-800 border border-slate-700/80 rounded-3xl p-6 space-y-4 flex flex-col">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            Riwayat Transaksi Booth Hari Ini ({todayTxs.length})
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
            {todayTxs.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 bg-slate-900/90 border border-slate-700/80 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-white block">{tx.items_summary}</span>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="font-mono">{tx.nfc_uid}</span>
                    <span>·</span>
                    <span>{tx.time}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-xs text-emerald-400 block">
                    +Rp {tx.amount.toLocaleString('id-ID')}
                  </span>
                  {tx.remaining_balance !== undefined && (
                    <span className="text-[10px] text-slate-500 font-medium">
                      Sisa: Rp {tx.remaining_balance.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Result Modal Overlay */}
      {resultModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50">
          <div
            className={`w-full max-w-md rounded-3xl p-8 text-center space-y-5 border shadow-2xl ${
              resultModal.status === 'success'
                ? 'bg-slate-900 border-emerald-500/50'
                : 'bg-slate-900 border-red-500/50'
            }`}
          >
            <div
              className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg ${
                resultModal.status === 'success'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-400 border border-red-500/40'
              }`}
            >
              {resultModal.status === 'success' ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <XCircle className="w-10 h-10" />
              )}
            </div>

            <div>
              <h2
                className={`text-xl font-black ${
                  resultModal.status === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {resultModal.title}
              </h2>
              <p className="text-xs text-slate-300 mt-1.5 font-medium">{resultModal.message}</p>
            </div>

            {resultModal.remaining_balance !== undefined && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
                <span className="text-slate-400 font-medium">Saldo Sisa Wristband Pengunjung</span>
                <span className="block text-xl font-black text-white">
                  Rp {resultModal.remaining_balance.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <button
              onClick={() => setResultModal(null)}
              className="w-full py-3.5 rounded-2xl bg-slate-800 text-white font-extrabold text-xs hover:bg-slate-700 border border-slate-700 transition-all"
            >
              Tutup &amp; Lanjut Transaksi Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
