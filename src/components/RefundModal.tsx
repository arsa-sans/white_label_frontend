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
  const [type, setType] = useState<'refund' | 'reschedule'>('refund');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError('Alasan wajib diisi.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/refunds', {
        order_id: ticket.order_id || ticket.id,
        ticket_id: ticket.id,
        type,
        reason: reason.trim(),
      });
      if (res.data.success) {
        setSuccess(true);
        onSuccess?.();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengajukan permohonan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setType('refund');
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
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Ajukan Refund / Reschedule
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
              <h3 className="text-base font-bold text-zinc-950">Permohonan Berhasil Diajukan!</h3>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Tim organizer akan meninjau permohonan Anda. Notifikasi status akan dikirimkan setelah diverifikasi.
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

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Jenis Permohonan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setType('refund')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all tactile-btn ${
                      type === 'refund'
                        ? 'border-red-300 bg-red-50 text-red-700 shadow-2xs'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4 text-red-600" />
                    Refund (Dana)
                  </button>
                  <button
                    onClick={() => setType('reschedule')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-bold transition-all tactile-btn ${
                      type === 'reschedule'
                        ? 'border-zinc-950 bg-zinc-950 text-white shadow-2xs'
                        : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Reschedule (Jadwal)
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">Alasan</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={
                    type === 'refund'
                      ? 'Jelaskan alasan pengembalian dana...'
                      : 'Jelaskan alasan pindah jadwal...'
                  }
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
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 tactile-btn ${
                    type === 'refund'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  }`}
                >
                  {loading
                    ? 'Mengirim...'
                    : type === 'refund'
                    ? 'Ajukan Refund'
                    : 'Ajukan Reschedule'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
