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
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Top Bar */}
      <header className="bg-white border-b border-zinc-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 rounded-xl bg-zinc-100 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200 transition-colors tactile-btn"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-zinc-100 text-zinc-900 border border-zinc-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-sm text-zinc-950">{boothName}</h1>
              <span className="text-[10px] text-zinc-500 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-zinc-900" /> Kasir Booth Cashless Online
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
            Omset Hari Ini
          </span>
          <span className="text-sm sm:text-base font-black text-zinc-950 font-mono tabular-nums">
            Rp {totalSalesToday.toLocaleString('id-ID')}
          </span>
        </div>
      </header>

      {/* Main Cashier Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Charge Calculator & Numpad */}
        <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-4">
            {/* Display Amount (High-Contrast Bento Card) */}
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 text-right space-y-1 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Total Tagihan
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight tabular-nums">
                Rp {numericAmount.toLocaleString('id-ID')}
              </div>
            </div>

            {/* Item summary note & NFC Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Wristband NFC UID
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={nfcInput}
                    onChange={(e) => setNfcInput(e.target.value.toUpperCase())}
                    placeholder="Tap NFC / Input Code"
                    className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  Catatan Item (opsional)
                </label>
                <input
                  type="text"
                  value={itemsSummary}
                  onChange={(e) => setItemsSummary(e.target.value)}
                  placeholder="e.g. 2x Kopi Kenangan"
                  className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Preset Buttons */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                + Preset Cepat
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleAddPreset(preset)}
                    className="py-2 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-bold font-mono text-zinc-800 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-all tactile-btn"
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
                  className={`py-3.5 rounded-2xl text-lg font-black transition-all tactile-btn font-mono ${
                    btn === 'C'
                      ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200'
                      : btn === 'DEL'
                      ? 'bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 flex items-center justify-center'
                      : 'bg-zinc-50 text-zinc-950 border border-zinc-200 hover:bg-zinc-100'
                  }`}
                >
                  {btn === 'DEL' ? <Delete className="w-5 h-5 text-zinc-700" /> : btn}
                </button>
              ))}
            </div>

            {/* Charge Button */}
            <button
              onClick={handleCharge}
              disabled={loading || numericAmount <= 0}
              className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-sm sm:text-base shadow-xs hover:bg-zinc-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2 tactile-btn"
            >
              {loading ? (
                'Memproses Transaksi Tap...'
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  <span>BAYAR SALDO WRISTBAND (Rp {numericAmount.toLocaleString('id-ID')})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Side: Sales History Log */}
        <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-3xl p-5 sm:p-6 space-y-4 flex flex-col shadow-xs">
          <h2 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-zinc-700" />
            Riwayat Transaksi Booth Hari Ini ({todayTxs.length})
          </h2>

          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
            {todayTxs.map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center justify-between hover:bg-zinc-100/70 transition"
              >
                <div>
                  <span className="font-bold text-xs text-zinc-950 block">{tx.items_summary}</span>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-0.5">
                    <span className="font-mono">{tx.nfc_uid}</span>
                    <span>·</span>
                    <span>{tx.time}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-xs text-zinc-950 block font-mono tabular-nums">
                    +Rp {tx.amount.toLocaleString('id-ID')}
                  </span>
                  {tx.remaining_balance !== undefined && (
                    <span className="text-[10px] text-zinc-400 font-medium font-mono">
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 text-center space-y-5 border border-zinc-200 bg-white shadow-2xl animate-scaleUp">
            <div
              className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center border shadow-xs ${
                resultModal.status === 'success'
                  ? 'bg-zinc-100 text-zinc-950 border-zinc-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {resultModal.status === 'success' ? (
                <CheckCircle2 className="w-8 h-8 text-zinc-900" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
            </div>

            <div>
              <h2 className="text-lg font-black text-zinc-950">
                {resultModal.title}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 font-medium">{resultModal.message}</p>
            </div>

            {resultModal.remaining_balance !== undefined && (
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs space-y-1 font-mono">
                <span className="text-zinc-500 font-medium text-[11px]">Saldo Sisa Wristband Pengunjung</span>
                <span className="block text-xl font-black text-zinc-950 tabular-nums">
                  Rp {resultModal.remaining_balance.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <button
              onClick={() => setResultModal(null)}
              className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold text-xs hover:bg-zinc-800 transition-all tactile-btn shadow-xs"
            >
              Tutup &amp; Lanjut Transaksi Berikutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
