'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, RefreshCw, ArrowRightLeft } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Ajukan Refund / Reschedule
          </h2>
          <button onClick={handleClose} className="p-1.5 rounded-xl hover:bg-slate-100 transition">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {success ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <RefreshCw className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Permohonan Berhasil Diajukan!</h3>
              <p className="text-xs text-slate-500">
                Tim organizer akan meninjau permohonan Anda. Anda akan menerima notifikasi saat status berubah.
              </p>
              <button
                onClick={handleClose}
                className="mt-3 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-500 transition"
              >
                Tutup
              </button>
            </div>
          ) : (
            <>
              {/* Ticket Info */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiket Terpilih</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{ticket.event_name}</p>
                {ticket.tier_name && (
                  <p className="text-xs text-slate-500">{ticket.tier_name}</p>
                )}
                {ticket.price !== undefined && (
                  <p className="text-xs font-bold text-indigo-600 mt-1">
                    Rp {ticket.price.toLocaleString('id-ID')}
                  </p>
                )}
              </div>

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Jenis Permohonan</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setType('refund')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      type === 'refund'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refund (Pengembalian)
                  </button>
                  <button
                    onClick={() => setType('reschedule')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      type === 'reschedule'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    Reschedule (Pindah)
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Alasan</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder={
                    type === 'refund'
                      ? 'Jelaskan alasan pengembalian dana...'
                      : 'Jelaskan alasan pindah jadwal...'
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition placeholder:text-slate-400 resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-600 font-medium">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 ${
                    type === 'refund'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
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
