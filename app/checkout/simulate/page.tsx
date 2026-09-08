'use client';

/**
 * app/checkout/simulate/page.tsx
 *
 * Payment Simulation Page (Bento Monochrome Light Theme)
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
  Check,
} from 'lucide-react';
import api from '@/lib/api';

// Payment method config
const PAYMENT_METHODS = [
  {
    id: 'qris',
    label: 'QRIS',
    sublabel: 'GoPay · OVO · Dana · BCA Mobile',
    icon: QrCode,
    processingTime: '< 5 detik',
  },
  {
    id: 'va_bca',
    label: 'Virtual Account BCA',
    sublabel: 'Transfer via ATM / m-Banking',
    icon: Building2,
    processingTime: '< 1 menit',
  },
  {
    id: 'va_mandiri',
    label: 'Virtual Account Mandiri',
    sublabel: 'Transfer via ATM / Livin\'',
    icon: Building2,
    processingTime: '< 1 menit',
  },
  {
    id: 'gopay',
    label: 'GoPay',
    sublabel: 'Bayar via aplikasi Gojek',
    icon: Smartphone,
    processingTime: '< 5 detik',
  },
  {
    id: 'credit_card',
    label: 'Kartu Kredit / Debit',
    sublabel: 'Visa · Mastercard · JCB',
    icon: CreditCard,
    processingTime: 'Instan',
  },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-5 w-48 bg-zinc-200 rounded-lg" />
      <div className="h-4 w-32 bg-zinc-100 rounded-lg" />
    </div>
  );
}

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

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-6 text-center">
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Pembayaran Berhasil</h1>
            <p className="text-xs text-zinc-500 mt-1 font-mono font-bold">Order ID: {orderId}</p>
          </div>

          {/* Issued tickets */}
          {tickets.length > 0 && (
            <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-2xs text-left space-y-3">
              <h3 className="text-xs font-bold text-zinc-950 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-emerald-600" />
                {tickets.length} Tiket Berhasil Diterbitkan
              </h3>
              <div className="space-y-2">
                {tickets.map((t: any) => (
                  <div
                    key={t.id}
                    className="flex justify-between items-center p-3 bg-zinc-50 rounded-xl border border-zinc-200"
                  >
                    <div>
                      <span className="block font-bold text-xs text-zinc-900">
                        Kursi {t.seat_name}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase font-mono tracking-wide">
                        {t.category}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black uppercase">
                      Valid
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Auto-redirect notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 font-medium">
            <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
            Menuju halaman tiket Anda dalam {countdown} detik...
          </div>

          <button
            onClick={() => router.push('/my-tickets')}
            className="w-full py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold shadow-xs transition-all text-xs tactile-btn"
          >
            Lihat Tiket Saya Sekarang &rarr;
          </button>
        </div>
      </div>
    );
  }

  // Processing overlay
  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-zinc-200" />
            <div className="absolute inset-0 rounded-full border-4 border-zinc-950 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-zinc-950" />
            </div>
          </div>
          <p className="text-sm font-extrabold text-zinc-950">Memproses Pembayaran...</p>
          <p className="text-xs text-zinc-400 font-medium">
            Simulasi via {selectedMeta.label}
          </p>
        </div>
      </div>
    );
  }

  // Main payment UI
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-zinc-900 w-full max-w-full overflow-x-hidden">
      {/* Dev mode banner */}
      <div className="w-full bg-zinc-950 border-b border-zinc-800 px-4 py-2 flex items-center justify-center gap-2 text-white">
        <ShieldCheck className="w-4 h-4 text-zinc-400 shrink-0" />
        <span className="text-xs font-semibold text-zinc-300">
          Sandbox Payment Gateway — Simulasi pengujian transaksi tiket
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 text-xs font-bold transition-all shadow-2xs tactile-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Checkout
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">Simulasi Pembayaran</h1>
          <p className="text-xs text-zinc-500 font-medium">
            Pilih metode pembayaran dan konfirmasi untuk menerbitkan barcode tiket.
          </p>
        </div>

        {/* Order summary card */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            <Banknote className="w-3.5 h-3.5 text-zinc-500" />
            Detail Pesanan
          </div>

          {orderId ? (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-medium">Order ID</span>
                <span className="font-mono font-bold text-zinc-900 truncate max-w-[200px]">
                  {orderId}
                </span>
              </div>
              <div className="flex justify-between text-xs items-center pt-2 border-t border-zinc-100">
                <span className="text-zinc-500 font-medium">Total Pembayaran</span>
                <span className="font-black text-zinc-950 text-base font-mono">
                  Rp {amount.toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ) : (
            <SkeletonCard />
          )}
        </div>

        {/* Payment method selection */}
        <div className="bg-white rounded-3xl border border-zinc-200 p-5 shadow-2xs space-y-4">
          <h2 className="text-xs font-extrabold text-zinc-950 flex items-center gap-2 uppercase tracking-wider">
            <CreditCard className="w-4 h-4 text-zinc-500" />
            Pilih Metode Pembayaran
          </h2>

          <div className="space-y-2.5">
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethod === method.id;
              const Icon = method.icon;

              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left tactile-btn ${
                    isSelected
                      ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950 shadow-2xs'
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50 bg-white'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                      isSelected
                        ? 'bg-zinc-950 text-white border-zinc-950'
                        : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <span className="block font-bold text-xs text-zinc-950">{method.label}</span>
                    <span className="text-[11px] text-zinc-500 font-medium">{method.sublabel}</span>
                  </div>

                  {/* Processing time */}
                  <div className="shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-400" />
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 font-mono">
                      {method.processingTime}
                    </span>
                  </div>

                  {/* Check indicator */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error message */}
        {step === 'error' && errorMsg && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-red-700">Pembayaran Gagal</p>
              <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Pay button */}
        {!orderId && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">
              Order ID tidak ditemukan. Kembali ke halaman checkout untuk memulai pesanan baru.
            </p>
          </div>
        )}

        <button
          onClick={handleSimulatePay}
          disabled={loading || !orderId}
          className="w-full py-3.5 rounded-xl bg-zinc-950 text-white font-bold text-xs
                     hover:bg-zinc-800 shadow-xs transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed
                     flex items-center justify-center gap-2 tactile-btn"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses Pembayaran...
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Simulasi Bayar via {selectedMeta.label}
            </>
          )}
        </button>

        <p className="text-center text-[10px] text-zinc-400 font-medium flex items-center justify-center gap-1">
          <ShieldCheck className="w-3 h-3 text-zinc-400" />
          Simulasi terenkripsi dev server. Tidak ada potongan saldo nyata.
        </p>
      </div>
    </div>
  );
}

export default function SimulatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-950" />
      </div>
    }>
      <SimulatePageInner />
    </Suspense>
  );
}
