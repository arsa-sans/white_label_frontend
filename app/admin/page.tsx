'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Users,
  CircleDollarSign,
  Ticket,
  ArrowRight,
  TrendingUp,
  Activity,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-zinc-100 text-zinc-900 border border-zinc-200 uppercase tracking-wider">
              Super Admin Mode
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight mt-1">
            Platform Master Dashboard
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Pantau seluruh metrik ekosistem White Label, kelola tenant, dan verifikasi izin organizer.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/tenants"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-100 transition shadow-2xs tactile-btn"
          >
            <Building2 className="w-4 h-4 text-zinc-700" /> Kelola Tenants
          </Link>
          <Link
            href="/admin/organizers"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200 text-zinc-900 text-xs font-bold hover:bg-zinc-100 transition shadow-2xs relative tactile-btn"
          >
            <Users className="w-4 h-4 text-zinc-700" /> Verifikasi Organizer
            {stats && stats.pending_organizer_approvals > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-bounce shadow-md">
                {stats.pending_organizer_approvals}
              </span>
            )}
          </Link>
          <Link
            href="/admin/audit"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-xs tactile-btn"
          >
            <Activity className="w-4 h-4 text-emerald-400" /> Audit Log
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (Bento Style) */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Gross Platform GMV</span>
              <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
                <CircleDollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-zinc-950 font-mono tracking-tight">
              Rp {stats.total_revenue.toLocaleString('id-ID')}
            </div>
            <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Transaksi Midtrans Selesai
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Tiket Terjual</span>
              <div className="p-2 bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-xl">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-zinc-950 font-mono tracking-tight">
              {stats.total_tickets_sold.toLocaleString('id-ID')} Tiket
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">
              Di {stats.total_events} Event Aktif
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Tenant White Label</span>
              <div className="p-2 bg-zinc-100 border border-zinc-200 text-zinc-900 rounded-xl">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-zinc-950 font-mono tracking-tight">
              {stats.total_tenants} Multi-Tenants
            </div>
            <p className="text-[10px] text-zinc-600 font-bold">
              Subdomain &amp; Branding Terisolasi
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Verifikasi Organizer</span>
              <div className="p-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-zinc-950 font-mono flex items-center gap-2 tracking-tight">
              {stats.total_organizers}
              {stats.pending_organizer_approvals > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 font-bold font-sans">
                  {stats.pending_organizer_approvals} Menunggu
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">
              {stats.total_visitors} Akun Pembeli Terdaftar
            </p>
          </div>
        </div>
      )}

      {/* Recent Global Orders Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-950 tracking-tight">
              Transaksi Global Terkini (Cross-Tenant)
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Semua order pembayaran tiket masuk ke platform secara realtime.
            </p>
          </div>
          <Link
            href="/dashboard/payouts"
            className="text-xs font-bold text-zinc-900 hover:text-zinc-600 flex items-center gap-1"
          >
            Kelola Payouts <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {stats && stats.recent_global_orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-zinc-100 text-[10px] uppercase font-bold text-zinc-400">
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Tenant ID</th>
                  <th className="py-2.5 px-3">User ID</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Gateway</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                {stats.recent_global_orders.map((ord: any) => (
                  <tr key={ord.id} className="hover:bg-zinc-50 transition">
                    <td className="py-3 px-3 font-mono font-bold text-zinc-950">{ord.id}</td>
                    <td className="py-3 px-3 text-zinc-900 font-bold">{ord.tenant_id}</td>
                    <td className="py-3 px-3 font-mono text-zinc-500">{ord.user_id}</td>
                    <td className="py-3 px-3 font-bold text-zinc-950 font-mono">
                      Rp {ord.amount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-semibold">{ord.payment_gateway || 'Midtrans'}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          ord.status === 'paid'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : ord.status === 'pending'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-zinc-400 font-mono">
                      {new Date(ord.created_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400 text-xs">Belum ada transaksi global.</div>
        )}
      </div>
    </div>
  );
}
