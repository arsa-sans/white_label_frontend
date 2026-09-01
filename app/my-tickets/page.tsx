'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, RefreshCw, Calendar, MapPin, FileDown, Loader2, Maximize2, X, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';
import RefundModal from '@/components/RefundModal';
import { io } from 'socket.io-client';

interface TicketItem {
  id: string;
  event_name: string;
  event_date: string;
  location: string;
  venue_name: string;
  banner_url: string;
  seat_name: string;
  category: string;
  price: number;
  status: 'valid' | 'used' | 'void' | 'refunded';
  issued_at: string;
}

function DynamicQRCard({
  ticket,
  onRefundClick,
}: {
  ticket: TicketItem;
  onRefundClick?: (ticket: TicketItem) => void;
}) {
  const [qrToken, setQrToken] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(ticket.status === 'valid');
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  const isUsed = ticket.status === 'used';
  const isCancelled = ticket.status === 'void' || ticket.status === 'refunded';

  useEffect(() => {
    // If ticket is already used or void, don't run dynamic rotation
    if (isUsed || isCancelled) {
      setLoading(false);
      return;
    }

    fetchQrToken();
    const interval = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          fetchQrToken();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [ticket.id, isUsed, isCancelled]);

  const fetchQrToken = async () => {
    try {
      const res = await api.get(`/tickets/${ticket.id}/qr-token`);
      if (res.data.success) {
        setQrToken(res.data.data.qr_token);
        setExpiresIn(res.data.data.expires_in_seconds || 30);
      }
    } catch {
      // Quiet UI error handling
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await api.get(`/tickets/${ticket.id}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `e-ticket-${ticket.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Gagal mengunduh PDF tiket. Pastikan server backend sedang aktif.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const progressPercent = ((30 - expiresIn) / 30) * 100;

  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6 shadow-md hover:shadow-xl transition-all">
        {/* QR Code Container with Countdown Ring */}
        <div className="relative flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div
            onClick={() => setIsZoomed(true)}
            className={`relative w-44 h-44 flex items-center justify-center bg-white p-3 rounded-xl shadow-inner border border-slate-100 cursor-pointer group transition-all ${
              !isUsed && !isCancelled ? 'hover:border-indigo-400 hover:shadow-md' : ''
            }`}
            title="Klik untuk memperbesar QR Code"
          >
            {loading ? (
              <div className="text-xs text-slate-400 animate-pulse font-semibold">Generasi QR...</div>
            ) : qrToken ? (
              <QRCodeSVG value={qrToken} size={150} level="H" />
            ) : (
              <div className="text-xs text-slate-400 font-bold text-center px-2">QR Code Tiket</div>
            )}

            {/* Click to Enlarge Badge Overlay */}
            {!isUsed && !isCancelled && (
              <div className="absolute inset-0 bg-indigo-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-1.5 text-white text-xs font-bold backdrop-blur-[1px]">
                <Maximize2 className="w-4 h-4" />
                <span>Perbesar</span>
              </div>
            )}

            {/* Scanned / Used Overlay */}
            {isUsed && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-3 text-center text-white space-y-1.5 z-10 animate-fadeIn">
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                  QR Code Telah Discan
                </span>
                <span className="text-[10px] text-slate-300 font-medium">Tiket sudah digunakan</span>
              </div>
            )}

            {/* Void / Refunded Overlay */}
            {isCancelled && (
              <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-[2px] rounded-xl flex flex-col items-center justify-center p-3 text-center text-white space-y-1.5 z-10">
                <span className="text-xs font-extrabold uppercase tracking-wider text-red-400">
                  TIKET {ticket.status.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* 30-Second Refresh Progress Bar */}
          <div className="w-full mt-3 space-y-1">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
              <span className="flex items-center gap-1">
                {!isUsed && !isCancelled ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
                    AES-256 Dynamic QR
                  </>
                ) : isUsed ? (
                  <span className="text-emerald-600 font-bold">✓ Tiket Telah Digunakan</span>
                ) : (
                  <span className="text-red-600 font-bold">Tiket Tidak Aktif</span>
                )}
              </span>
              {!isUsed && !isCancelled && (
                <span className="font-mono text-indigo-600 font-extrabold">{expiresIn}s</span>
              )}
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear ${
                  isUsed
                    ? 'bg-emerald-500 w-full'
                    : isCancelled
                    ? 'bg-red-400 w-full'
                    : 'bg-gradient-to-r from-indigo-500 to-cyan-500'
                }`}
                style={!isUsed && !isCancelled ? { width: `${100 - progressPercent}%` } : undefined}
              />
            </div>
          </div>
        </div>

        {/* Ticket Meta Details */}
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase ${
                ticket.status === 'valid'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : ticket.status === 'used'
                  ? 'bg-slate-200 text-slate-700 border border-slate-300'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              {ticket.status === 'valid'
                ? '✓ TIKET VALID & READY'
                : ticket.status === 'used'
                ? '✓ TELAH DISCAN (CHECKED-IN)'
                : ticket.status.toUpperCase()}
            </span>
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {ticket.category}
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900">{ticket.event_name}</h3>

          <div className="space-y-1 text-xs font-medium text-slate-600">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>{new Date(ticket.event_date).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <MapPin className="w-4 h-4 text-cyan-600" />
              <span>{ticket.venue_name} ({ticket.location})</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4 text-xs font-semibold">
            <div className="flex gap-4">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Tier / Kursi</span>
                <span className="text-sm font-extrabold text-indigo-600">{ticket.seat_name}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Harga</span>
                <span className="text-slate-900 font-bold">Rp {ticket.price.toLocaleString('id-ID')}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Ticket ID</span>
                <span className="font-mono text-slate-500">{ticket.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                title="Download E-Tiket PDF Resmi"
              >
                {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5 text-indigo-400" />}
                <span>{downloadingPdf ? 'Mengunduh...' : 'Unduh PDF'}</span>
              </button>
              {onRefundClick && ticket.status === 'valid' && (
                <button
                  onClick={() => onRefundClick(ticket)}
                  className="px-3 py-2 rounded-xl border border-slate-300 hover:border-red-400 hover:bg-red-50 text-slate-600 hover:text-red-700 text-xs font-semibold transition"
                >
                  Refund / Reschedule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Lightbox / Enlarge Modal */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl flex flex-col items-center space-y-5 text-center relative border border-slate-100 animate-scaleUp"
          >
            <button
              onClick={() => setIsZoomed(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {ticket.seat_name}
              </span>
              <h4 className="text-base font-extrabold text-slate-900 mt-2 line-clamp-1">
                {ticket.event_name}
              </h4>
              <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {ticket.id}</p>
            </div>

            {/* Large QR Container */}
            <div className="relative p-5 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner flex items-center justify-center">
              <div className="bg-white p-3 rounded-xl shadow-sm">
                {qrToken ? (
                  <QRCodeSVG value={qrToken} size={240} level="H" />
                ) : (
                  <div className="w-60 h-60 flex items-center justify-center text-xs text-slate-400">
                    QR Code
                  </div>
                )}
              </div>

              {isUsed && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-[2px] rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                  <span className="text-sm font-black uppercase tracking-wider text-emerald-300">
                    QR Code Telah Discan
                  </span>
                  <span className="text-xs text-slate-300">Tiket ini telah digunakan</span>
                </div>
              )}
            </div>

            {/* Dynamic Countdown */}
            {!isUsed && !isCancelled ? (
              <div className="w-full space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-slate-600 px-1">
                  <span className="flex items-center gap-1 text-indigo-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Dynamic Token
                  </span>
                  <span className="font-mono text-indigo-600 font-extrabold">{expiresIn} detik</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${100 - progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 font-medium pt-1">
                  Tunjukkan layar ini langsung ke petugas Gate Scanner
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">Tiket sudah tidak aktif untuk entry</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refundTarget, setRefundTarget] = useState<TicketItem | null>(null);

  const fetchTickets = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get('/tickets/my-tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch {
      // Quiet UI error handling
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);

    // Real-time Socket.IO listener for immediate scan updates
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1\/?$/, '') ||
      'http://localhost:5000';

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    const handleScanUpdate = (data: any) => {
      const scannedId = data.ticket_id;
      const isSuccessful = data.result === 'valid' || data.result === 'duplicate' || data.status === 'used';
      
      if (scannedId && isSuccessful) {
        setTickets((prev) =>
          prev.map((t) => (t.id === scannedId ? { ...t, status: 'used' } : t))
        );
      }
    };

    socket.on('gate:scan_result', handleScanUpdate);
    socket.on('ticket:scanned', handleScanUpdate);

    // Silent background poll every 3 seconds to guarantee updates across devices
    const pollInterval = setInterval(() => {
      fetchTickets(false);
    }, 3000);

    return () => {
      socket.off('gate:scan_result', handleScanUpdate);
      socket.off('ticket:scanned', handleScanUpdate);
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-indigo-600" />
          Tiket Saya &amp; Dynamic QR Entry
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-1">
          Tunjukkan QR Code dinamis ini ke petugas pintu masuk. Token berotasi otomatis setiap 30 detik untuk mencegah duplikasi/tangkapan layar.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm animate-pulse font-medium">
          Memuat daftar tiket Anda...
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm bg-white rounded-3xl border border-slate-200 font-medium">
          Anda belum memiliki tiket terbit. Pesan tiket di halaman katalog!
        </div>
      ) : (
        <div className="space-y-6">
          {tickets.map((ticket) => (
            <DynamicQRCard
              key={ticket.id}
              ticket={ticket}
              onRefundClick={(t) => setRefundTarget(t)}
            />
          ))}
        </div>
      )}

      {/* Refund / Reschedule Modal */}
      {refundTarget && (
        <RefundModal
          isOpen={!!refundTarget}
          onClose={() => setRefundTarget(null)}
          ticket={{
            id: refundTarget.id,
            event_name: refundTarget.event_name,
            tier_name: refundTarget.seat_name,
            price: refundTarget.price,
          }}
          onSuccess={() => {
            fetchTickets();
          }}
        />
      )}
    </div>
  );
}

