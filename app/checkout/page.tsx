'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Timer, CreditCard, QrCode, Building2, CheckCircle2, Ticket, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, selectedSeats, activeEventId, clearSeatSelection } = useAppStore();

  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va' | 'wallet'>('qris');
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes (300 sec)
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const handlePayNow = async () => {
    if (selectedSeats.length === 0) {
      alert('Tidak ada kursi yang dipilih.');
      router.push('/');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Create order with Idempotency Key
      const idempotencyKey = `idemp-${Date.now()}-${Math.random()}`;
      const orderRes = await api.post(
        '/payments/orders',
        {
          event_id: activeEventId || 'evt-001',
          seat_ids: selectedSeats.map((s) => s.id),
          payment_gateway: paymentMethod.toUpperCase(),
        },
        {
          headers: {
            'x-idempotency-key': idempotencyKey,
          },
        }
      );

      const orderData = orderRes.data.data;

      // 2. Simulate Payment Completion
      const payRes = await api.post(`/payments/orders/${orderData.id}/pay`, {
        payment_method: paymentMethod,
      });

      if (payRes.data.success) {
        setSuccessOrder(payRes.data.data);
        clearSeatSelection();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Proses pembayaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">Pembayaran Berhasil!</h1>
          <p className="text-xs text-zinc-500">Order ID: <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">{successOrder.order.id}</span></p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-indigo-600" />
            Tiket Terbit ({successOrder.tickets.length} Tiket)
          </h3>
          <div className="space-y-2">
            {successOrder.tickets.map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Kursi: {t.seat_name}</span>
                  <span className="text-[10px] text-zinc-400">Kategori: {t.category}</span>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  Valid / Ready
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/my-tickets')}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            Lihat Tiket Dynamic QR Saya
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Pemilihan Kursi
      </button>

      {/* Seat Lock Countdown Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white font-bold">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-amber-900 dark:text-amber-200">Kursi Anda Sedang Ditahan (Hold Lock)</span>
            <span className="text-[11px] text-amber-700 dark:text-amber-300">Selesaikan pembayaran sebelum waktu habis agar kunci kursi tidak lepas.</span>
          </div>
        </div>
        <div className="text-xl font-black font-mono text-amber-800 dark:text-amber-300 px-3 py-1 bg-amber-100 dark:bg-amber-900/60 rounded-xl">
          {formatTimer(timeLeft)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Pilih Metode Pembayaran
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('qris')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                  paymentMethod === 'qris'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-600'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <QrCode className="w-6 h-6 text-indigo-600" />
                <div>
                  <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">QRIS Instant</span>
                  <span className="text-[10px] text-zinc-500">GoPay, OVO, Dana, BCA</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('va')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                  paymentMethod === 'va'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-600'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <Building2 className="w-6 h-6 text-cyan-600" />
                <div>
                  <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">Virtual Account</span>
                  <span className="text-[10px] text-zinc-500">BCA, Mandiri, BRI, BNI</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                  paymentMethod === 'wallet'
                    ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 ring-2 ring-indigo-600'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <div>
                  <span className="block font-bold text-xs text-zinc-900 dark:text-zinc-100">Dompet Cashless</span>
                  <span className="text-[10px] text-zinc-500">Saldo Event Wallet</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Ringkasan Pesanan</h3>

            <div className="space-y-3 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-4">
              {selectedSeats.map((seat) => (
                <div key={seat.id} className="flex justify-between items-center">
                  <span className="text-zinc-600 dark:text-zinc-400 font-medium">
                    Kursi {seat.row}-{seat.number} ({seat.category})
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">
                    Rp {seat.price.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm pt-2">
              <span className="font-bold text-zinc-900 dark:text-zinc-100">Total Pembayaran</span>
              <span className="font-extrabold text-indigo-600 text-lg">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handlePayNow}
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Memproses Transaksi...' : 'Bayar Sekarang & Terbitkan Tiket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
