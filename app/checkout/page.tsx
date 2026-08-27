'use client';

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Ticket,
  ArrowLeft,
  Loader2,
  Tag,
  X,
  Clock,
  AlertTriangle,
  Plus,
  Minus,
} from 'lucide-react';
import { useAppStore, TicketTier } from '@/lib/store';
import api from '@/lib/api';
import { useConfirm } from '@/hooks/useConfirm';

declare global {
  interface Window {
    snap?: any;
  }
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const {
    cart,
    activeEventId,
    clearCart,
    user,
    updateCartQuantity,
    queueSessionId,
    checkoutExpiresAt,
    clearQueueSession,
  } = useAppStore();

  const eventId = searchParams.get('event_id') || activeEventId || '';

  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [tiers, setTiers] = useState<TicketTier[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);
  const [eventName, setEventName] = useState<string>('');

  // Timer state
  const [remainingSeconds, setRemainingSeconds] = useState<number>(60);
  const [timerExpired, setTimerExpired] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoMessage, setPromoMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Helper to load Midtrans Snap.js script dynamically
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

  // Load Midtrans Snap.js on mount
  useEffect(() => {
    loadSnapScript();
  }, []);

  // Validate session & start timer on mount
  useEffect(() => {
    if (!user) {
      router.push('/register');
      return;
    }
    if (!eventId) {
      router.push('/events');
      return;
    }
    validateAndStartTimer();
    fetchTiers();
    fetchEventName();
  }, [eventId]);

  const validateAndStartTimer = async () => {
    try {
      const res = await api.get('/queue/validate-session', {
        params: { event_id: eventId },
      });
      if (res.data.success && res.data.data.valid) {
        const remaining = res.data.data.remaining_seconds;
        setRemainingSeconds(remaining);
        startTimer(remaining);
      } else {
        // Session not valid, but allow checkout anyway for demo flexibility
        // Use default 60 seconds
        setRemainingSeconds(60);
        startTimer(60);
      }
    } catch {
      // Fallback: use 60s timer
      setRemainingSeconds(60);
      startTimer(60);
    }
  };

  const startTimer = (seconds: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = seconds;
    timerRef.current = setInterval(() => {
      remaining--;
      setRemainingSeconds(Math.max(0, remaining));
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimerExpired(true);
      }
    }, 1000);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle timer expiry
  useEffect(() => {
    if (timerExpired && !successOrder) {
      clearCart();
      clearQueueSession();
      const doRedirect = async () => {
        await confirm({
          segmentTag: 'SESI HABIS',
          title: 'Waktu Checkout Habis',
          message: 'Waktu checkout Anda telah habis (1 menit). Silakan masuk antrian kembali untuk membeli tiket.',
          confirmText: 'Kembali ke Event',
          cancelText: 'Tutup',
          variant: 'warning',
        });
        router.push(`/event/${eventId}`);
      };
      doRedirect();
    }
  }, [timerExpired]);

  const fetchTiers = async () => {
    setTiersLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/tiers`);
      if (res.data.success) {
        setTiers(res.data.data);
      }
    } catch {
      // silent
    } finally {
      setTiersLoading(false);
    }
  };

  const fetchEventName = async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      if (res.data.success) {
        setEventName(res.data.data.name);
      }
    } catch {
      // silent
    }
  };

  const eventCartItems = cart.filter((c) => c.event_id === eventId);
  const subtotal = eventCartItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const discountAmount = appliedPromo ? appliedPromo.discount_amount : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount);
  const totalTickets = eventCartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleQuantityChange = (tier: TicketTier, delta: number) => {
    updateCartQuantity(
      {
        tier_id: tier.id,
        tier_name: tier.name,
        event_id: eventId,
        event_name: eventName,
        unit_price: tier.price,
      },
      delta
    );
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setValidatingPromo(true);
    setPromoMessage(null);
    try {
      const res = await api.post('/promos/validate', {
        code: promoInput.trim().toUpperCase(),
        event_id: eventId,
        cart_total: subtotal,
      });
      if (res.data.success) {
        setAppliedPromo(res.data.data);
        setPromoMessage({ text: res.data.message, type: 'success' });
      }
    } catch (err: any) {
      setAppliedPromo(null);
      setPromoMessage({
        text: err.response?.data?.message || 'Kode promo tidak valid atau kadaluarsa.',
        type: 'error',
      });
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput('');
    setPromoMessage(null);
  };

  // ── Primary: Pay via Official Midtrans Snap Sandbox ─────────────────────
  const handlePayClick = async () => {
    if (totalTickets === 0) {
      setErrorMsg('Pilih minimal 1 tiket sebelum melanjutkan.');
      return;
    }

    if (timerExpired) {
      setErrorMsg('Waktu checkout telah habis. Silakan masuk antrian kembali.');
      return;
    }

    const isConfirmed = await confirm({
      segmentTag: 'KONFIRMASI PEMBAYARAN',
      title: 'Konfirmasi Pembelian Tiket',
      message: `Total tagihan Anda adalah Rp ${finalPrice.toLocaleString('id-ID')} untuk ${totalTickets} tiket.${appliedPromo ? ` (Termasuk hemat diskon Rp ${discountAmount.toLocaleString('id-ID')})` : ''} Lanjutkan ke gerbang pembayaran resmi Midtrans Sandbox?`,
      confirmText: 'Buka Midtrans Snap',
      cancelText: 'Batal',
      variant: 'info',
    });

    if (!isConfirmed) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const orderRes = await api.post(
        '/payments/orders',
        {
          event_id: eventId,
          items: eventCartItems.map((item) => ({
            tier_id: item.tier_id,
            quantity: item.quantity,
          })),
          promo_code: appliedPromo ? appliedPromo.promo?.code || promoInput.toUpperCase() : undefined,
          payment_gateway: 'MIDTRANS',
          customer_name: user?.name,
          customer_email: user?.email,
        },
        {
          headers: { 'x-idempotency-key': idempotencyKey },
        }
      );

      const resData = orderRes.data.data;
      const orderObj = resData?.order || resData;
      const snapToken = resData?.payment?.snap_token || resData?.snap_token;
      const redirectUrl = resData?.payment?.redirect_url || resData?.redirect_url;
      const gatewayWarning = resData?.gateway_warning || resData?.payment?.gateway_warning;

      if (!orderObj?.id) {
        throw new Error('Gagal membuat pesanan di server.');
      }

      // Stop timer after order is created
      if (timerRef.current) clearInterval(timerRef.current);

      // Ensure snap script is loaded
      await loadSnapScript();

      const isRealSnap = snapToken && !snapToken.startsWith('sim-');

      if (isRealSnap && (window.snap || redirectUrl)) {
        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess: async (result: any) => {
              const payRes = await api.post(`/payments/orders/${orderObj.id}/pay`, {
                payment_method: 'midtrans',
                transaction_result: result,
              });
              if (payRes.data.success) {
                setSuccessOrder(payRes.data.data);
                clearCart();
                clearQueueSession();
              }
            },
            onPending: async (result: any) => {
              const payRes = await api.post(`/payments/orders/${orderObj.id}/pay`, {
                payment_method: 'midtrans',
                transaction_result: result,
              });
              if (payRes.data.success) {
                setSuccessOrder(payRes.data.data);
                clearCart();
                clearQueueSession();
              }
            },
            onError: () => {
              setErrorMsg('Pembayaran gagal atau dibatalkan di Midtrans Sandbox.');
              setLoading(false);
            },
            onClose: () => {
              setErrorMsg('Jendela pembayaran Midtrans ditutup sebelum selesai.');
              setLoading(false);
            },
          });
        } else if (redirectUrl) {
          // Direct popup window or redirect to Midtrans Sandbox payment URL
          window.location.href = redirectUrl;
        }
      } else {
        setErrorMsg(
          gatewayWarning ||
          'Gagal membuka Midtrans Sandbox: Token Snap tidak valid. Silakan periksa MIDTRANS_SERVER_KEY dan MIDTRANS_CLIENT_KEY di file .env backend & frontend.'
        );
        setLoading(false);
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMsg(serverMsg || 'Proses pembayaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // ── Secondary: Sandbox Dummy Simulation (Instant Demo / Testing) ───────────
  const handleDummyPay = async () => {
    if (totalTickets === 0) {
      setErrorMsg('Pilih minimal 1 tiket sebelum memulai simulasi.');
      return;
    }

    const isConfirmed = await confirm({
      segmentTag: 'MODE TESTING / DEMO',
      title: 'Simulasi Sandbox Dummy',
      message: `Jalankan simulasi pembayaran instan untuk total Rp ${finalPrice.toLocaleString('id-ID')} (${totalTickets} tiket)? Ini akan menerbitkan tiket QR valid untuk testing/demo.`,
      confirmText: 'Mulai Simulasi Bayar',
      cancelText: 'Batal',
      variant: 'warning',
    });

    if (!isConfirmed) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const idempotencyKey = `idemp-sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const orderRes = await api.post(
        '/payments/orders',
        {
          event_id: eventId,
          items: eventCartItems.map((item) => ({
            tier_id: item.tier_id,
            quantity: item.quantity,
          })),
          promo_code: appliedPromo ? appliedPromo.promo?.code || promoInput.toUpperCase() : undefined,
          payment_gateway: 'SANDBOX_SIMULATION',
          customer_name: user?.name,
          customer_email: user?.email,
        },
        {
          headers: { 'x-idempotency-key': idempotencyKey },
        }
      );

      const resData = orderRes.data.data;
      const orderObj = resData?.order || resData;

      if (!orderObj?.id) {
        throw new Error('Gagal membuat pesanan di server.');
      }

      if (timerRef.current) clearInterval(timerRef.current);

      // Settle payment instantly in dummy mode
      const payRes = await api.post(`/payments/orders/${orderObj.id}/pay`, {
        payment_method: 'sandbox_dummy',
      });

      if (payRes.data.success) {
        setSuccessOrder(payRes.data.data);
        clearCart();
        clearQueueSession();
      }
    } catch (err: any) {
      const serverMsg = err.response?.data?.message || err.message;
      setErrorMsg(serverMsg || 'Simulasi pembayaran gagal.');
    } finally {
      setLoading(false);
    }
  };

  // Timer display helpers
  const timerMinutes = Math.floor(remainingSeconds / 60);
  const timerSecs = remainingSeconds % 60;
  const timerText = `${timerMinutes.toString().padStart(2, '0')}:${timerSecs.toString().padStart(2, '0')}`;
  const timerProgress = (remainingSeconds / 60) * 100;
  const isTimerWarning = remainingSeconds <= 15;

  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900">Pembayaran Berhasil!</h1>
          <p className="text-xs text-slate-500">
            Order ID: <span className="font-mono font-bold text-slate-700">{successOrder.order.id}</span>
          </p>
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Countdown Timer Header */}
      <div className={`rounded-3xl p-5 border shadow-sm transition-all ${
        isTimerWarning
          ? 'bg-red-50 border-red-300 animate-pulse'
          : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isTimerWarning ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <Clock className="w-6 h-6 text-indigo-600" />
            )}
            <div>
              <h2 className={`text-sm font-bold ${
                isTimerWarning ? 'text-red-800' : 'text-slate-900'
              }`}>
                {isTimerWarning ? 'Waktu Hampir Habis!' : 'Waktu Checkout'}
              </h2>
              <p className={`text-[10px] font-medium ${
                isTimerWarning ? 'text-red-600' : 'text-slate-500'
              }`}>
                Selesaikan pembayaran sebelum waktu habis
              </p>
            </div>
          </div>
          <div className={`text-3xl font-black font-mono ${
            isTimerWarning ? 'text-red-600' : 'text-indigo-600'
          }`}>
            {timerText}
          </div>
        </div>
        {/* Progress Bar */}
        <div className="mt-3 w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isTimerWarning ? 'bg-red-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={() => {
          clearCart();
          clearQueueSession();
          router.push(`/event/${eventId}`);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-xs"
      >
        <ArrowLeft className="w-4 h-4 text-slate-600" />
        Batalkan & Kembali
      </button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tier Selection */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-indigo-600" />
                Pilih Kategori Tiket
              </h2>
              {eventName && (
                <p className="text-xs text-slate-500 font-medium mt-1">{eventName}</p>
              )}
            </div>

            {tiersLoading ? (
              <div className="text-center py-8 text-slate-400 text-sm animate-pulse">Memuat tiket...</div>
            ) : (
              <div className="space-y-4">
                {tiers.map((tier) => {
                  const available = tier.available !== undefined ? tier.available : tier.quota - tier.sold;
                  const isSoldOut = available <= 0;
                  const cartItem = eventCartItems.find((c) => c.tier_id === tier.id);
                  const currentQty = cartItem ? cartItem.quantity : 0;

                  return (
                    <div
                      key={tier.id}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        currentQty > 0
                          ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-600 shadow-sm'
                          : isSoldOut
                          ? 'border-slate-200 bg-slate-50 opacity-60'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 border-2 border-white shadow-xs"
                            style={{ backgroundColor: tier.color }}
                          />
                          <h3 className="font-extrabold text-slate-900 text-base">{tier.name}</h3>
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                              isSoldOut
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isSoldOut ? 'Habis (Sold Out)' : `Tersisa ${available} tiket`}
                          </span>
                        </div>
                        {tier.description && (
                          <p className="text-xs text-slate-600 font-normal leading-relaxed">{tier.description}</p>
                        )}
                        <div className="text-base font-black text-indigo-700">
                          Rp {tier.price.toLocaleString('id-ID')}{' '}
                          <span className="text-xs font-normal text-slate-400">/ tiket</span>
                        </div>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        {isSoldOut ? (
                          <span className="text-xs font-bold text-slate-400 bg-slate-200 px-4 py-2 rounded-xl">
                            Sold Out
                          </span>
                        ) : (
                          <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                            <button
                              onClick={() => handleQuantityChange(tier, -1)}
                              disabled={currentQty === 0}
                              className="w-8 h-8 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-200 disabled:opacity-30 transition-all flex items-center justify-center shadow-xs"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center text-sm font-extrabold text-slate-900 font-mono">
                              {currentQty}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(tier, 1)}
                              disabled={currentQty >= available}
                              className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-30 transition-all flex items-center justify-center shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">Ringkasan Pesanan</h3>

            {totalTickets === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">Belum ada tiket dipilih</p>
            ) : (
              <div className="space-y-3 text-xs border-b border-slate-100 pb-4">
                {eventCartItems.map((item) => (
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
            )}

            {/* Promo Code Section */}
            <div className="space-y-2 pt-1 border-b border-slate-100 pb-4">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-purple-600" />
                Punya Kode Promo?
              </label>
              {appliedPromo ? (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      %
                    </div>
                    <div>
                      <div className="font-bold text-xs text-purple-900 font-mono">
                        {appliedPromo.promo?.code}
                      </div>
                      <div className="text-[10px] text-purple-700 font-medium">
                        Hemat Rp {discountAmount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRemovePromo}
                    className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-white/80 transition"
                    title="Hapus Promo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="KODE PROMO"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold uppercase text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 transition"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={validatingPromo || !promoInput.trim()}
                    className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                  >
                    {validatingPromo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Terapkan'
                    )}
                  </button>
                </div>
              )}
              {promoMessage && (
                <p
                  className={`text-[11px] font-medium mt-1 ${
                    promoMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {promoMessage.text}
                </p>
              )}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Subtotal Tiket</span>
                <span className="font-semibold text-slate-800">
                  Rp {subtotal.toLocaleString('id-ID')}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-600 font-semibold">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Potongan Diskon
                  </span>
                  <span>- Rp {discountAmount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100 font-bold text-slate-900">
                <span>Total Tagihan</span>
                <span className="font-black text-indigo-600 text-lg">
                  Rp {finalPrice.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                {errorMsg}
              </div>
            )}

            <div className="space-y-2.5 pt-2">
              <button
                onClick={handlePayClick}
                disabled={loading || totalTickets === 0 || timerExpired}
                className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Memproses Midtrans...' : timerExpired ? 'Waktu Habis' : 'Bayar via Midtrans Sandbox'}
              </button>

              <button
                onClick={handleDummyPay}
                disabled={loading || totalTickets === 0 || timerExpired}
                className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>🧪</span>
                <span>Mode Testing: Simulasi Sandbox Dummy</span>
              </button>
            </div>

            <div className="text-center pt-1">
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                Mendukung Midtrans Snap Resmi &amp; Sandbox Dummy Testing
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-400 text-sm animate-pulse flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
          Memuat sesi checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
