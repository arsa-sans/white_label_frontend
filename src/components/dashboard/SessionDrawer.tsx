'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
import api from '@/lib/api';

export interface EventSession {
  id: string;
  event_id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  description: string;
  sort_order: number;
}

interface SessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
}

export default function SessionDrawer({
  isOpen,
  onClose,
  eventId,
  eventName,
}: SessionDrawerProps) {
  const [sessions, setSessions] = useState<EventSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<EventSession | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('22:00');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && eventId) {
      fetchSessions();
    }
  }, [isOpen, eventId]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/sessions`);
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingSession(null);
    setName(`Day ${sessions.length + 1}`);
    setDate(new Date().toISOString().slice(0, 10));
    setStartTime('14:00');
    setEndTime('22:00');
    setDescription('');
    setSortOrder(sessions.length + 1);
    setError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (session: EventSession) => {
    setEditingSession(session);
    setName(session.name);
    setDate(session.date ? session.date.slice(0, 10) : '');
    setStartTime(session.start_time);
    setEndTime(session.end_time);
    setDescription(session.description || '');
    setSortOrder(session.sort_order || 1);
    setError('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !startTime || !endTime) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingSession) {
        await api.put(`/events/${eventId}/sessions/${editingSession.id}`, {
          name,
          date,
          start_time: startTime,
          end_time: endTime,
          description,
          sort_order: Number(sortOrder),
        });
      } else {
        await api.post(`/events/${eventId}/sessions`, {
          name,
          date,
          start_time: startTime,
          end_time: endTime,
          description,
          sort_order: Number(sortOrder),
        });
      }
      setIsFormOpen(false);
      fetchSessions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal menyimpan sesi event.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini?')) return;
    try {
      await api.delete(`/events/${eventId}/sessions/${sessionId}`);
      fetchSessions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal menghapus sesi.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex justify-end animate-fadeIn">
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col justify-between border-l border-zinc-200">
        {/* Header (Clean Bento Monochrome) */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-100 sticky top-0 bg-white z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-950">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">
                  Kelola Sesi &amp; Hari Event
                </h2>
                <p className="text-xs text-zinc-500 font-medium truncate max-w-xs">{eventName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">
                Daftar Sesi ({sessions.length})
              </span>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-2xs tactile-btn"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Sesi / Hari
              </button>
            </div>

            {/* Form Section */}
            {isFormOpen && (
              <form onSubmit={handleSubmit} className="bg-zinc-50 border border-zinc-200 rounded-3xl p-5 space-y-4 animate-fadeIn shadow-2xs">
                <div className="flex justify-between items-center border-b border-zinc-200 pb-2">
                  <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-wide">
                    {editingSession ? 'Edit Sesi' : 'Tambah Sesi Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs text-zinc-400 hover:text-zinc-700 font-bold"
                  >
                    Batal
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-3.5 py-2 text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama Sesi / Hari *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Day 1 - Main Stage Lineup"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Tanggal *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Urutan (Sort Order)</label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono"
                      min={1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Jam Mulai *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Jam Selesai *</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Deskripsi / Lineup Artis</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Lineup pengisi acara hari ini..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-white text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 tactile-btn"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingSession ? 'Perbarui Sesi' : 'Simpan Sesi'}</span>
                </button>
              </form>
            )}

            {/* Sessions List */}
            {loading ? (
              <div className="text-center py-10 text-zinc-400 text-xs animate-pulse">
                Memuat daftar sesi...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-zinc-50 border border-zinc-200 rounded-3xl p-6">
                <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-zinc-900">Belum Ada Sesi Tambahan</p>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-xs mx-auto">
                  Untuk event multi-hari, tambahkan sesi harian agar pembeli tiket dapat melihat jadwal spesifik per hari.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-2xs hover:border-zinc-300 transition flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-950 font-bold text-[10px] flex items-center justify-center font-mono">
                          {session.sort_order || idx + 1}
                        </span>
                        <h4 className="text-xs font-extrabold text-zinc-950">{session.name}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-zinc-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {session.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {session.start_time} - {session.end_time} WIB
                        </span>
                      </div>
                      {session.description && (
                        <p className="text-[11px] text-zinc-600 mt-1 leading-relaxed">{session.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(session)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-950 transition tactile-btn"
                        title="Edit Sesi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition tactile-btn"
                        title="Hapus Sesi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-100 bg-zinc-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition tactile-btn"
          >
            Tutup Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
