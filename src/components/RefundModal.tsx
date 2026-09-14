'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw, ArrowRightLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: {
    id: string;
    order_id?: string;
    event_name: string;
    tier_name?: string;
    price?: number;
  };
  onSuccess?: () => void;
}

export default function RefundModal({ isOpen, onClose, ticket, onSuccess }: RefundModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Alasan refund wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/refunds', {
        order_id: ticket.order_id,
        ticket_id: ticket.id,
        reason: reason.trim(),
      });
      if (res.data.success) {
        setSuccess(true);
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengajukan refund. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setError('');
    setSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-red-600" />
            Pengajuan Refund Tiket
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-zinc-950">Pengajuan Refund Berhasil!</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Permohonan refund Anda sedang ditinjau. Setelah disetujui, dana akan langsung masuk ke Saldo E-Wallet website Anda.
              </p>
              <button
                onClick={handleClose}
                className="mt-3 px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition shadow-xs tactile-btn"
              >
                Tutup
              </button>
            </div>
          ) : (
            <>
              {/* Ticket Info */}
              <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tiket Terpilih</p>
                <p className="text-sm font-bold text-zinc-950 mt-1">{ticket.event_name}</p>
                {ticket.tier_name && (
                  <p className="text-xs text-zinc-500">{ticket.tier_name}</p>
                )}
                {ticket.price !== undefined && (
                  <p className="text-xs font-bold text-zinc-950 font-mono mt-1">
                    Rp {ticket.price.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Wallet Info Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-800 font-medium leading-relaxed">
                💡 Dana refund akan dikreditkan langsung ke <strong>Saldo E-Wallet website WhiteLabel</strong> Anda, apapun metode pembayaran yang digunakan saat checkout.
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Alasan Pengajuan Refund
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan alasan pengembalian dana tiket Anda..."
                  className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 font-semibold focus:ring-2 focus:ring-zinc-950 focus:bg-white transition placeholder:text-zinc-400 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700 font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition tactile-btn"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 tactile-btn bg-red-600 hover:bg-red-700 text-white flex items-center justify-center gap-2"
                >
                  {loading ? 'Mengirim...' : 'Ajukan Refund'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
