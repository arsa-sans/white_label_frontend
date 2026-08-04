'use client';

import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Ticket, RefreshCw, Calendar, MapPin } from 'lucide-react';
import api from '@/lib/api';

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

function DynamicQRCard({ ticket }: { ticket: TicketItem }) {
  const [qrToken, setQrToken] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
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
  }, [ticket.id]);

  const fetchQrToken = async () => {
    try {
      const res = await api.get(`/tickets/${ticket.id}/qr-token`);
      if (res.data.success) {
        setQrToken(res.data.data.qr_token);
        setExpiresIn(res.data.data.expires_in_seconds || 30);
      }
    } catch {
      // Quiet UI error handling without console.log
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = ((30 - expiresIn) / 30) * 100;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col md:flex-row items-center gap-6 shadow-md hover:shadow-xl transition-all">
      {/* QR Code Container with Countdown Ring */}
      <div className="relative flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <div className="relative w-44 h-44 flex items-center justify-center bg-white p-3 rounded-xl shadow-inner border border-slate-100">
          {loading ? (
            <div className="text-xs text-slate-400 animate-pulse font-semibold">Generasi QR...</div>
          ) : qrToken ? (
            <QRCodeSVG value={qrToken} size={150} level="H" />
          ) : (
            <div className="text-xs text-red-500 font-bold text-center px-2">Gagal memuat Dynamic QR</div>
          )}
        </div>

        {/* 30-Second Refresh Progress Bar */}
        <div className="w-full mt-3 space-y-1">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />
              AES-256 Dynamic QR
            </span>
            <span className="font-mono text-indigo-600 font-extrabold">{expiresIn}s</span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-1000 ease-linear"
              style={{ width: `${100 - progressPercent}%` }}
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
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            {ticket.status === 'valid' ? '✓ TIKET VALID & READY' : ticket.status.toUpperCase()}
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

        <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-center md:justify-start gap-4 text-xs font-semibold">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 uppercase">Nomor Kursi</span>
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
      </div>
    </div>
  );
}

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tickets/my-tickets');
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch {
      // Quiet UI error handling without console.log
    } finally {
      setLoading(false);
    }
  };

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
            <DynamicQRCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
}
