'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CreditCard, QrCode, Building2, CheckCircle2, Ticket, ArrowLeft, Loader2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import api from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';

declare global {
  interface Window {
    snap?: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const { cart, activeEventId, clearCart, user } = useAppStore();

  const [paymentMethod, setPaymentMethod] = useState<'midtrans' | 'qris' | 'va' | 'wallet'>('midtrans');
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Load Midtrans Snap.js script dynamically
  useEffect(() => {
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'Mid-client-vuSELOSGIb9GhTe1';
    const scriptId = 'midtrans-script';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', clientKey);
      document.body.appendChild(script);
    }
  }, []);

  const totalPrice = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const handlePayClick = async () => {
    if (cart.length === 0) {
      router.push('/');
      return;
    }

    const isConfirmed = await confirm({
      segmentTag: 'KONFIRMASI PEMBAYARAN',
      title: 'Konfirmasi Pembelian Tiket',
      message: `Total tagihan Anda adalah Rp ${totalPrice.toLocaleString('id-ID')} untuk ${cart.reduce((s, i) => s + i.quantity, 0)} tiket. Lanjutkan ke gerbang pembayaran Midtrans Sandbox?`,
      confirmText: 'Lanjut ke Pembayaran',
      cancelText: 'Batal',
      variant: 'info',
    });

    if (!isConfirmed) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Create order with Idempotency Key
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const orderRes = await api.post(
        '/payments/orders',
        {
          event_id: activeEventId || cart[0]?.event_id || 'evt-001',
          items: cart.map((item) => ({
            tier_id: item.tier_id,
            quantity: item.quantity,
          })),
          payment_gateway: paymentMethod.toUpperCase(),
          customer_name: user?.name,
          customer_email: user?.email,
        },
        {
          headers: {
            'x-idempotency-key': idempotencyKey,
          },
        }
      );

      const resData = orderRes.data.data;
      const orderObj = resData?.order || resData;
      const snapToken = resData?.payment?.snap_token || resData?.snap_token;
      const isRealSnap = snapToken && !snapToken.startsWith('sim-');

      if (!orderObj?.id) {
        throw new Error('Gagal membuat pesanan di server.');
      }

      // 2. Midtrans Snap Popup vs Simulation Flow
      if (isRealSnap && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: async (result: any) => {
            // Confirm simulation completion on backend
            const payRes = await api.post(`/payments/orders/${orderObj.id}/pay`, {
              payment_method: paymentMethod,
            });
            if (payRes.data.success) {
              setSuccessOrder(payRes.data.data);
              clearCart();
            }
          },
          onPending: async (result: any) => {
            const payRes = await api.post(`/payments/orders/${orderObj.id}/pay`, {
              payment_method: paymentMethod,
            });
            if (payRes.data.success) {
              setSuccessOrder(payRes.data.data);
              clearCart();
            }
          },
          onError: (result: any) => {
            setErrorMsg('Pembayaran gagal atau dibatalkan di Midtrans.');
            setLoading(false);
          },
          onClose: () => {
            setErrorMsg('Jendela pembayaran Midtrans ditutup sebelum selesai.');
            setLoading(false);
          },
        });
      } else {
        // Fallback simulation mode
        const payRes = await api.post(`/payments/orders/${orderObj.id}/pay`, {
          payment_method: paymentMethod,
        });

        if (payRes.data.success) {
          setSuccessOrder(payRes.data.data);
          clearCart();
        }
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMsg(serverMsg || 'Proses pembayaran gagal. Silakan coba lagi.');
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
              <div key={t.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">Kategori Tiket: {t.tier_name || t.seat_name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">ID: {t.id}</span>
                </div>
                <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
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
        Kembali ke Detail Event
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Payment Methods */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Pilih Metode Pembayaran
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-200">
                Midtrans Sandbox Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod('midtrans')}
                className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between h-28 ${
                  paymentMethod === 'midtrans'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600 shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-6 h-6 text-indigo-600" />
                <div>
                  <span className="block font-bold text-xs text-slate-900">Midtrans Snap Popup</span>
                  <span className="text-[10px] text-slate-500 font-medium">QRIS, VA, E-Wallet, Card</span>
                </div>
              </button>

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
                  <span className="text-[10px] text-slate-500 font-medium">GoPay, OVO, Dana, Shopee</span>
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
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Ringkasan Pesanan</h3>

            <div className="space-y-3 text-xs border-b border-slate-100 pb-4">
              {cart.map((item) => (
                <div key={item.tier_id} className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">
                    {item.tier_name} × {item.quantity}
                  </span>
                  <span className="font-bold text-slate-900">
                    Rp {(item.quantity * item.unit_price).toLocaleString('id-ID')}
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
              disabled={loading || cart.length === 0}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Memproses Transaksi...' : 'Bayar Sekarang via Midtrans'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
