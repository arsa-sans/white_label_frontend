'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, Ticket, QrCode, Users, RefreshCw, CircleDollarSign, Activity, CheckCircle2 } from 'lucide-react';
import api from '@/lib/api';

interface DashboardMetrics {
  total_revenue: number;
  total_tickets_sold: number;
  total_events: number;
  total_scanned: number;
  occupancy_rate_percent: number;
  checkin_rate_percent: number;
  recent_orders: any[];
  gate_scan_logs_recent: any[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{value}</div>
      {sub && <div className="text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

function OccupancyBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
        <span className="font-extrabold text-zinc-900 dark:text-zinc-100">{percent}%</span>
      </div>
      <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Failed to fetch dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Organizer Dashboard
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Metrik penjualan real-time, gate check-in, dan analytics event aktif.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
          <span className="text-[10px] text-zinc-400 hidden sm:inline">
            ({lastRefresh.toLocaleTimeString('id-ID')})
          </span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-400 text-sm animate-pulse">Memuat metrik dashboard...</div>
      ) : metrics ? (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={CircleDollarSign}
              label="Total Revenue"
              value={`Rp ${(metrics.total_revenue / 1000000).toFixed(1)}jt`}
              sub={`${metrics.total_tickets_sold} tiket terjual`}
              color="bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
            />
            <StatCard
              icon={Ticket}
              label="Tiket Terjual"
              value={String(metrics.total_tickets_sold)}
              sub={`${metrics.total_events} event aktif`}
              color="bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300"
            />
            <StatCard
              icon={QrCode}
              label="Check-in Gate"
              value={String(metrics.total_scanned)}
              sub={`${metrics.checkin_rate_percent}% dari tiket sold`}
              color="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            />
            <StatCard
              icon={Activity}
              label="Occupancy Rate"
              value={`${metrics.occupancy_rate_percent}%`}
              sub="vs total kapasitas kursi"
              color="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            />
          </div>

          {/* Occupancy & Check-in Rate Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Tingkat Occupancy &amp; Check-In
              </h2>
              <div className="space-y-4">
                <OccupancyBar
                  label="Occupancy Rate (Seat Sold)"
                  percent={metrics.occupancy_rate_percent}
                  color="bg-gradient-to-r from-indigo-500 to-indigo-600"
                />
                <OccupancyBar
                  label="Gate Check-In Rate"
                  percent={metrics.checkin_rate_percent}
                  color="bg-gradient-to-r from-emerald-400 to-emerald-600"
                />
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-400">
                Data diperbarui setiap 30 detik secara otomatis.
              </div>
            </div>

            {/* Recent Gate Scans */}
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Recent Gate Scans
              </h2>
              {metrics.gate_scan_logs_recent.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400">Belum ada aktivitas scan gate.</div>
              ) : (
                <div className="space-y-2">
                  {metrics.gate_scan_logs_recent.map((log: any, idx: number) => (
                    <div
                      key={log.id || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">{log.ticket_id}</span>
                        <span className="text-zinc-400">
                          {new Date(log.scanned_at).toLocaleTimeString('id-ID')}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.result === 'valid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.result === 'duplicate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.result}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Transaksi Terakhir
            </h2>
            {metrics.recent_orders.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-400">Belum ada transaksi.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left text-[10px] uppercase tracking-wider text-zinc-400">
                      <th className="pb-2 pr-4">Order ID</th>
                      <th className="pb-2 pr-4">Gateway</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Total</th>
                      <th className="pb-2">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/60">
                    {metrics.recent_orders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="py-2.5 pr-4 font-mono text-zinc-700 dark:text-zinc-300">{order.id}</td>
                        <td className="py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">{order.payment_gateway}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              order.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : order.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-bold text-zinc-900 dark:text-zinc-100">
                          Rp {order.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 text-zinc-400">
                          {new Date(order.created_at).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-20 text-zinc-500 text-sm">
          Gagal memuat metrik. Pastikan backend sedang berjalan.
        </div>
      )}
    </div>
  );
}
