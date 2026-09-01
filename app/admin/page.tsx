'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  Building2,
  Users,
  CircleDollarSign,
  Ticket,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface PlatformStats {
  total_revenue: number;
  total_tickets_sold: number;
  total_events: number;
  total_tenants: number;
  total_organizers: number;
  pending_organizer_approvals: number;
  total_visitors: number;
  recent_global_orders: any[];
}

export default function SuperAdminPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    fetchStats();
  }, [user, token, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/stats');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Memuat metrik Super Admin Platform..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">
              Super Admin Mode
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
            Platform Master Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pantau seluruh metrik ekosistem White Label, kelola tenant, dan verifikasi izin organizer.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/tenants"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition shadow-xs"
          >
            <Building2 className="w-4 h-4" /> Kelola Tenants
          </Link>
          <Link
            href="/admin/organizers"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 transition shadow-xs relative"
          >
            <Users className="w-4 h-4" /> Verifikasi Organizer
            {stats && stats.pending_organizer_approvals > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-bounce shadow-md">
                {stats.pending_organizer_approvals}
              </span>
            )}
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Activity className="w-4 h-4 text-emerald-400" /> Audit Log
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Platform GMV</span>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CircleDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              Rp {stats.total_revenue.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Transaksi Midtrans Selesai
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Tiket Terjual</span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.total_tickets_sold.toLocaleString('id-ID')} Tiket
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Di {stats.total_events} Event Aktif
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tenant White Label</span>
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">
              {stats.total_tenants} Multi-Tenants
            </div>
            <p className="text-[10px] text-blue-600 font-bold">
              Subdomain &amp; Branding Terisolasi
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Verifikasi Organizer</span>
              <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              {stats.total_organizers}
              {stats.pending_organizer_approvals > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                  {stats.pending_organizer_approvals} Menunggu
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {stats.total_visitors} Akun Pembeli Terdaftar
            </p>
          </div>
        </div>
      )}

      {/* Recent Global Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Transaksi Global Terkini (Cross-Tenant)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Semua order pembayaran tiket masuk ke platform secara realtime.
            </p>
          </div>
          <Link
            href="/dashboard/payouts"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
          >
            Kelola Payouts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats && stats.recent_global_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Tenant ID</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {stats.recent_global_orders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{ord.id}</td>
                    <td className="py-3 px-3 text-indigo-600 font-bold">{ord.tenant_id}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{ord.user_id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">
                      Rp {ord.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-semibold">{ord.payment_gateway || 'Midtrans'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ord.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(ord.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-xs">Belum ada transaksi global.</div>
        )}
      </div>
    </div>
  );
}
