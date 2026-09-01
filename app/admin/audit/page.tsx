'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  Clock,
  User,
  Search,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface AuditItem {
  id: string;
  timestamp: string;
  action: string;
  actor_email: string;
  actor_role: string;
  target_id?: string;
  details?: string;
}

export default function AdminAuditPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null);
    const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('wl_user') : null;
    let currentUser = user;
    if (!currentUser && storedUserStr) {
      try {
        currentUser = JSON.parse(storedUserStr);
      } catch {}
    }

    if (!currentToken || (currentUser && currentUser.role !== 'admin')) {
      router.replace('/login');
      return;
    }
    fetchLogs();
  }, [user, token, router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor_email.toLowerCase().includes(search.toLowerCase()) ||
      (l.details && l.details.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) return <LoadingSpinner message="Memuat jejak audit platform..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-950 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Super Admin Dashboard
          </Link>
          <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2 tracking-tight">
            <Activity className="w-6 h-6 text-zinc-900" />
            Platform Audit Trail &amp; Log Keamanan
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Catatan kronologis seluruh aksi penting admin, provision tenant, dan verifikasi izin organizer.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 hover:bg-zinc-100 transition shadow-2xs tactile-btn"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Log
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari berdasarkan aksi, email admin, atau detail log..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 focus:ring-2 focus:ring-zinc-950 placeholder:text-zinc-400 bg-white shadow-2xs"
        />
      </div>

      {/* Audit Logs Stream */}
      <div className="bg-white rounded-3xl border border-zinc-200 overflow-hidden shadow-2xs">
        <div className="divide-y divide-zinc-100">
          {filtered.map((log) => (
            <div key={log.id} className="p-5 hover:bg-zinc-50 transition space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-950 text-white font-mono tracking-wider">
                    {log.action}
                  </span>
                  {log.target_id && (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 border border-zinc-200 text-zinc-900 text-[10px] font-mono font-bold">
                      Target: {log.target_id}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium text-zinc-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  {new Date(log.timestamp).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
              </div>

              <p className="text-xs text-zinc-800 font-medium leading-relaxed">
                {log.details || 'Aksi dieksekusi oleh akun berwenang.'}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-medium">
                <User className="w-3 h-3 text-zinc-400" />
                <span>Pelaksana: <span className="font-semibold text-zinc-800 font-mono">{log.actor_email}</span> ({log.actor_role})</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-400 text-xs font-medium">
              Tidak ada catatan audit yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
