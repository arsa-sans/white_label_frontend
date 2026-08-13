'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Timer, CreditCard, QrCode, Building2, CheckCircle2, Ticket, ArrowLeft } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';
import { segmentConfirmTemplates } from '@/lib/confirmPresets';

export default function CheckoutPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { selectedSeats, activeEventId, clearSeatSelection } = useAppStore();

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

  const handlePayClick = async () => {
    if (selectedSeats.length === 0) {
      router.push('/');
      return;
    }

    const isConfirmed = await segmentConfirmTemplates.checkout(confirm, {
      amount: totalPrice,
      paymentMethod,
      itemCount: selectedSeats.length,
    });

    if (!isConfirmed) return;

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
      const orderId = orderData?.order?.id || orderData?.id;

      if (!orderId) {
        throw new Error('Gagal mendapatkan Order ID dari server.');
      }

      // 2. Simulate Payment Completion
      const payRes = await api.post(`/payments/orders/${orderId}/pay`, {
        payment_method: paymentMethod,
      });

      if (payRes.data.success) {
        setSuccessOrder(payRes.data.data);
        clearSeatSelection();
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMsg(serverMsg || 'Proses pembayaran gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Pembayaran Berhasil!</h1>
          <p className="text-xs text-slate-500">Order ID: <span className="font-mono font-bold text-slate-700">{successOrder.order.id}</span></p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 text-left space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Ticket className="w-4 h-4 text-indigo-600" />
            Tiket Terbit ({successOrder.tickets.length} Tiket)
          </h3>
          <div className="space-y-2">
            {successOrder.tickets.map((t: any) => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Kursi: {t.seat_name}</span>
                  <span className="text-[10px] text-slate-400 font-medium">Kategori: {t.category}</span>
                </div>
                <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  Valid / Ready
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push('/my-tickets')}
            className="px-6 py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
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
        onClick={() => {
          if (activeEventId) {
            router.push(`/event/${activeEventId}`);
          } else {
            router.back();
          }
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" />
        Kembali ke Pemilihan Kursi
      </button>

      {/* Seat Lock Countdown Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500 text-white font-bold">
            <Timer className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-xs font-bold text-amber-900">Kursi Anda Sedang Ditahan (Hold Lock)</span>
            <span className="text-[11px] text-amber-700 font-medium">Selesaikan pembayaran sebelum waktu habis agar kunci kursi tidak lepas.</span>
          </div>
        </div>
        <div className="text-xl font-black font-mono text-amber-800 px-3 py-1 bg-amber-100 rounded-xl border border-amber-200">
          {formatTimer(timeLeft)}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              Pilih Metode Pembayaran
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('qris')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                  paymentMethod === 'qris'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-6 h-6 text-indigo-600" />
                <div>
                  <span className="block font-bold text-xs text-slate-900">QRIS Instant</span>
                  <span className="text-[10px] text-slate-500 font-medium">GoPay, OVO, Dana, BCA</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('va')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                  paymentMethod === 'va'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-6 h-6 text-cyan-600" />
                <div>
                  <span className="block font-bold text-xs text-slate-900">Virtual Account</span>
                  <span className="text-[10px] text-slate-500 font-medium">BCA, Mandiri, BRI, BNI</span>
                </div>
              </button>

              <button
                onClick={() => setPaymentMethod('wallet')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                  paymentMethod === 'wallet'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
                <div>
                  <span className="block font-bold text-xs text-slate-900">Dompet Cashless</span>
                  <span className="text-[10px] text-slate-500 font-medium">Saldo Event Wallet</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Ringkasan Pesanan</h3>

            <div className="space-y-3 text-xs border-b border-slate-100 pb-4">
              {selectedSeats.map((seat) => (
                <div key={seat.id} className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    Kursi {seat.row}-{seat.number} ({seat.category})
                  </span>
                  <span className="font-bold text-slate-900">
                    Rp {seat.price.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm pt-2">
              <span className="font-bold text-slate-900">Total Pembayaran</span>
              <span className="font-black text-indigo-600 text-lg">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handlePayClick}
              disabled={loading || selectedSeats.length === 0}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Memproses Transaksi...' : 'Bayar Sekarang & Terbitkan Tiket'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
