'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Plus, Trash2, Edit2, Loader2, ListOrdered } from 'lucide-react';
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl flex flex-col justify-between">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Kelola Sesi &amp; Hari Event
              </h2>
              <p className="text-xs text-slate-500 font-medium">{eventName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daftar Sesi ({sessions.length})
              </span>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Tambah Sesi / Hari
              </button>
            </div>

            {/* Form Drawer Section */}
            {isFormOpen && (
              <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 animate-fadeIn">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {editingSession ? 'Edit Sesi' : 'Tambah Sesi Baru'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    Batal
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl px-3.5 py-2 text-xs font-medium">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Sesi / Hari *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Day 1 - Opening Ceremony &amp; Indie Band"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal *</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Urutan (Sort Order)</label>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      min={1}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Mulai *</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Selesai *</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi / Rundown Lineup</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Lineup artis: Feast, Hindia, Pamungkas"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingSession ? 'Perbarui Sesi' : 'Simpan Sesi'}</span>
                </button>
              </form>
            )}

            {/* Sessions List */}
            {loading ? (
              <div className="text-center py-10 text-slate-400 text-xs animate-pulse">
                Memuat daftar sesi...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl p-6">
                <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Belum Ada Sesi Multi-Day</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                  Untuk event lebih dari 1 hari, tambahkan sesi harian agar tiket dapat dikelompokkan per hari atau All-Day Pass.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-300 transition flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                          {session.sort_order || idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900">{session.name}</h4>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-500" />
                          {session.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" />
                          {session.start_time} - {session.end_time} WIB
                        </span>
                      </div>
                      {session.description && (
                        <p className="text-[11px] text-slate-600 mt-1">{session.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(session)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition"
                        title="Edit Sesi"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(session.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
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
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
