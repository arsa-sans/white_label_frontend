'use client';

/**
 * app/checkout/simulate/page.tsx
 *
 * FASE 5 — Payment Simulation Page
 *
 * Halaman fallback yang digunakan ketika Midtrans Snap tidak dikonfigurasi (dev mode).
 * User diarahkan ke sini dari createOrder jika MIDTRANS_SERVER_KEY tidak ada.
 *
 * Flow:
 *   1. createOrder → backend returns snap_redirect_url = /checkout/simulate?order_id=...&amount=...
 *   2. User memilih metode pembayaran simulasi
 *   3. Klik "Simulasi Bayar" → POST /payments/orders/:id/pay
 *   4. Redirect ke /my-tickets setelah sukses
 *
 * Midtrans Snap embed (real mode):
 *   Ketika MIDTRANS_CLIENT_KEY tersedia di FE, checkout/page.tsx akan load Midtrans Snap.js
 *   dan menampilkan popup payment — halaman simulate ini hanya untuk dev mode.
 */

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  QrCode,
  Building2,
  Smartphone,
  CreditCard,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ArrowLeft,
  Ticket,
  Banknote,
  Clock,
} from 'lucide-react';
import api from '@/lib/api';

// ─── Payment method config ────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'qris',
    label: 'QRIS',
    sublabel: 'GoPay · OVO · Dana · BCA Mobile',
    icon: QrCode,
    color: 'indigo',
    processingTime: '< 5 detik',
  },
  {
    id: 'va_bca',
    label: 'Virtual Account BCA',
    sublabel: 'Transfer via ATM / m-Banking',
    icon: Building2,
    color: 'blue',
    processingTime: '< 1 menit',
  },
  {
    id: 'va_mandiri',
    label: 'Virtual Account Mandiri',
    sublabel: 'Transfer via ATM / Livin\'',
    icon: Building2,
    color: 'blue',
    processingTime: '< 1 menit',
  },
  {
    id: 'gopay',
    label: 'GoPay',
    sublabel: 'Bayar via aplikasi Gojek',
    icon: Smartphone,
    color: 'green',
    processingTime: '< 5 detik',
  },
  {
    id: 'credit_card',
    label: 'Kartu Kredit / Debit',
    sublabel: 'Visa · Mastercard · JCB',
    icon: CreditCard,
    color: 'purple',
    processingTime: 'Instan',
  },
];

// ─── Color variant map ────────────────────────────────────────────────────────
const COLOR_STYLES: Record<string, { ring: string; bg: string; text: string; badge: string }> = {
  indigo: {
    ring: 'ring-indigo-500 border-indigo-500',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  blue: {
    ring: 'ring-blue-500 border-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700',
  },
  green: {
    ring: 'ring-green-500 border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
  purple: {
    ring: 'ring-purple-500 border-purple-500',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    badge: 'bg-purple-100 text-purple-700',
  },
};

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 w-48 bg-slate-200 rounded-lg" />
      <div className="h-4 w-32 bg-slate-100 rounded-lg" />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
function SimulatePageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get('order_id') || '';
  const amount = Number(searchParams.get('amount') || 0);

  const [selectedMethod, setSelectedMethod] = useState(PAYMENT_METHODS[0].id);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [tickets, setTickets] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Auto-redirect countdown after success
  useEffect(() => {
    if (step !== 'success') return;
    if (countdown <= 0) {
      router.push('/my-tickets');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [step, countdown, router]);

  const handleSimulatePay = async () => {
    if (!orderId) return;
    setLoading(true);
    setStep('processing');
    setErrorMsg('');

    try {
      // Simulate small network delay to feel realistic
      await new Promise((r) => setTimeout(r, 1200));

      const res = await api.post(`/payments/orders/${orderId}/pay`, {
        payment_method: selectedMethod,
      });

      if (res.data.success) {
        setTickets(res.data.data?.tickets || []);
        setStep('success');
      } else {
        throw new Error(res.data.message || 'Payment failed');
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          'Simulasi pembayaran gagal. Pastikan backend berjalan dan order valid.'
      );
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const selectedMeta = PAYMENT_METHODS.find((m) => m.id === selectedMethod)!;
  const colorStyle = COLOR_STYLES[selectedMeta.color] || COLOR_STYLES.indigo;

  // ── Success screen ─────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6 text-center">
          {/* Success icon with animation */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-black text-slate-900">Pembayaran Berhasil!</h1>
            <p className="text-sm text-slate-500 mt-1 font-mono">Order: {orderId}</p>
          </div>

          {/* Issued tickets */}
          {tickets.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-5 shadow-lg shadow-slate-100/60 text-left space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" />
                {tickets.length} Tiket Berhasil Diterbitkan
              </h3>
              <div className="space-y-2">
                {tickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100"
                  >
                    <div>
                      <span className="block font-bold text-xs text-slate-900">
                        Kursi {t.seat_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                        {t.category}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-bold uppercase">
                      Valid
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-redirect notice */}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 font-medium">
            <Loader2 className="w-4 h-4 animate-spin" />
            Menuju halaman tiket dalam {countdown} detik...
          </div>

          <button
            onClick={() => router.push('/my-tickets')}
            className="w-full py-3.5 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all text-sm"
          >
            Lihat Dynamic QR Tiket Saya →
          </button>
        </div>
      </div>
    );
  }

  // ── Processing overlay ─────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
          <p className="text-base font-bold text-slate-900">Memproses Pembayaran...</p>
          <p className="text-xs text-slate-400 font-medium">
            Simulasi {selectedMeta.label} · Mohon tunggu
          </p>
        </div>
      </div>
    );
  }

  // ── Main payment UI ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Dev mode banner */}
      <div className="w-full bg-amber-400/90 backdrop-blur-sm border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-900 flex-shrink-0" />
        <span className="text-xs font-bold text-amber-900">
          DEV MODE — Simulasi pembayaran. Tidak ada transaksi nyata yang terjadi.
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Back button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/checkout');
            }
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" />
          Kembali ke Checkout
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900">Simulasi Pembayaran</h1>
          <p className="text-sm text-slate-500">
            Pilih metode pembayaran dan klik tombol untuk mensimulasikan transaksi berhasil.
          </p>
        </div>

        {/* Order summary card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <Banknote className="w-4 h-4" />
            Detail Pesanan
          </div>

          {orderId ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Order ID</span>
                <span className="font-mono font-bold text-slate-800 text-xs truncate max-w-[200px]">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total Pembayaran</span>
                <span className="font-black text-indigo-600 text-base">
                  Rp {amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <SkeletonCard />
          )}
        </div>

        {/* Payment method selection */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-500" />
            Pilih Metode Pembayaran
          </h2>

          <div className="space-y-2.5">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethod === method.id;
              const style = COLOR_STYLES[method.color] || COLOR_STYLES.indigo;
              const Icon = method.icon;

              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? `${style.ring} ${style.bg} ring-2`
                      : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected ? `${style.bg} ${style.text}` : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-sm text-slate-900">{method.label}</span>
                    <span className="text-[11px] text-slate-500 font-medium">{method.sublabel}</span>
                  </div>

                  {/* Processing time */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? style.badge : 'bg-slate-100 text-slate-500'
                    }`}>
                      {method.processingTime}
                    </span>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${
                      isSelected ? `${style.text} border-current` : 'border-slate-300'
                    }`}
                  >
                    {isSelected && (
                      <div className={`w-full h-full rounded-full scale-50 ${style.text.replace('text-', 'bg-')}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {step === 'error' && errorMsg && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Pembayaran Gagal</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Pay button */}
        {!orderId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              Order ID tidak ditemukan. Kembali ke halaman checkout untuk memulai pesanan baru.
            </p>
          </div>
        )}

        <button
          onClick={handleSimulatePay}
          disabled={loading || !orderId}
          className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-extrabold text-base
                     hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              Simulasi Bayar via {selectedMeta.label}
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-slate-400 font-medium">
          🔒 Simulasi aman · Tidak ada biaya nyata yang dikenakan · Data hanya tersimpan di server dev
        </p>
      </div>
    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <SimulatePageInner />
    </Suspense>
  );
}
