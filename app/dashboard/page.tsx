'use client';

import React, { useEffect, useState } from 'react';
import { LayoutDashboard, TrendingUp, Ticket, QrCode, RefreshCw, CircleDollarSign, Activity, CheckCircle2 } from 'lucide-react';
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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 font-medium">{sub}</div>}
    </div>
  );
}

function OccupancyBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-extrabold text-slate-900">{percent}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
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
    } catch {
      // Quiet error handling without console.log
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Organizer Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Metrik penjualan real-time, gate check-in, dan analytics event aktif.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
          <span className="text-[10px] text-slate-400 font-semibold hidden sm:inline">
            ({lastRefresh.toLocaleTimeString('id-ID')})
          </span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse font-medium">Memuat metrik dashboard...</div>
      ) : metrics ? (
        <>
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={CircleDollarSign}
              label="Total Revenue"
              value={`Rp ${(metrics.total_revenue / 1000000).toFixed(1)}jt`}
              sub={`${metrics.total_tickets_sold} tiket terjual`}
              color="bg-indigo-50 text-indigo-700 border border-indigo-100"
            />
            <StatCard
              icon={Ticket}
              label="Tiket Terjual"
              value={String(metrics.total_tickets_sold)}
              sub={`${metrics.total_events} event aktif`}
              color="bg-cyan-50 text-cyan-700 border border-cyan-100"
            />
            <StatCard
              icon={QrCode}
              label="Check-in Gate"
              value={String(metrics.total_scanned)}
              sub={`${metrics.checkin_rate_percent}% dari tiket sold`}
              color="bg-emerald-50 text-emerald-700 border border-emerald-100"
            />
            <StatCard
              icon={Activity}
              label="Occupancy Rate"
              value={`${metrics.occupancy_rate_percent}%`}
              sub="vs total kapasitas kursi"
              color="bg-amber-50 text-amber-700 border border-amber-100"
            />
          </div>

          {/* Occupancy & Check-in Rate Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
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

              <div className="pt-2 border-t border-slate-100 text-xs font-medium text-slate-400">
                Data diperbarui setiap 30 detik secara otomatis.
              </div>
            </div>

            {/* Recent Gate Scans */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-600" />
                Recent Gate Scans
              </h2>
              {metrics.gate_scan_logs_recent.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 font-medium">Belum ada aktivitas scan gate.</div>
              ) : (
                <div className="space-y-2">
                  {metrics.gate_scan_logs_recent.map((log: any, idx: number) => (
                    <div
                      key={log.id || idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{log.ticket_id}</span>
                        <span className="text-slate-400 font-medium">
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
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Transaksi Terakhir
            </h2>
            {metrics.recent_orders.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400 font-medium">Belum ada transaksi.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="pb-2 pr-4">Order ID</th>
                      <th className="pb-2 pr-4">Gateway</th>
                      <th className="pb-2 pr-4">Status</th>
                      <th className="pb-2 pr-4">Total</th>
                      <th className="pb-2">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {metrics.recent_orders.map((order: any) => (
                      <tr key={order.id}>
                        <td className="py-2.5 pr-4 font-mono text-slate-700 font-bold">{order.id}</td>
                        <td className="py-2.5 pr-4 text-slate-600 font-medium">{order.payment_gateway}</td>
                        <td className="py-2.5 pr-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
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
                        <td className="py-2.5 pr-4 font-bold text-slate-900">
                          Rp {order.amount.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 text-slate-400 font-medium">
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
        <div className="text-center py-20 text-slate-500 text-sm font-medium">
          Gagal memuat metrik. Pastikan backend sedang berjalan.
        </div>
      )}
    </div>
  );
}
