'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, TrendingUp, Ticket, QrCode, RefreshCw, CircleDollarSign, Activity, CheckCircle2, Store, UserCheck, Plus, Trash2, Calendar } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

interface DashboardMetrics {
  total_revenue: number;
  total_tickets_sold: number;
  total_events: number;
  total_scanned: number;
  occupancy_rate_percent: number;
  checkin_rate_percent: number;
  recent_orders?: any[];
  recent_scan_logs?: any[];
  gate_scan_logs_recent?: any[];
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
  const { user, token } = useAppStore();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Tab state: 'analytics' | 'staff' | 'vendors'
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'vendors'>('analytics');

  // Staff management states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'gate_staff' | 'vendor'>('gate_staff');
  const [staffError, setStaffError] = useState('');

  useEffect(() => {
    if (!token) {
      router.replace('/events');
      return;
    }

    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      router.replace('/events');
      return;
    }

    fetchMetrics();
    fetchStaff();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [user, token, router]);

  const fetchMetrics = async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    setStaffLoading(true);
    try {
      const res = await api.get('/events/evt-001/staff');
      if (res.data.success) {
        setStaffList(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setStaffLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPassword) {
      setStaffError('Semua kolom wajib diisi');
      return;
    }

    setStaffError('');
    try {
      const res = await api.post('/events/evt-001/staff', {
        name: staffName,
        email: staffEmail,
        password: staffPassword,
        role: staffRole,
      });

      if (res.data.success) {
        setStaffList((prev) => [...prev, res.data.data]);
        setAddStaffOpen(false);
        setStaffName('');
        setStaffEmail('');
        setStaffPassword('');
      }
    } catch (err: any) {
      setStaffError(err.response?.data?.message || 'Gagal menambahkan akun');
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      const res = await api.delete(`/events/evt-001/staff/${staffId}`);
      if (res.data.success) {
        setStaffList((prev) => prev.filter((s) => s.id !== staffId && s.user_id !== staffId));
      }
    } catch {
      // Quiet error handling
    }
  };

  const gateStaffMembers = staffList.filter((s) => s.role === 'gate_staff' || !s.role);
  const vendorMembers = staffList.filter((s) => s.role === 'vendor');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Organizer Dashboard
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Pantau metrik penjualan tiket, kelola petugas gate staff, dan vendor booth.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Beranda &amp; Analytics
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'staff' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Kelola Gate Staff ({gateStaffMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'vendors' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Kelola Vendor ({vendorMembers.length})
            </button>
          </div>

          <button
            onClick={() => { fetchMetrics(); fetchStaff(); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {activeTab === 'staff' ? (
        /* Staff Management Section */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Pengelolaan Akun Gate Staff Event
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftarkan gate staff. Akun ini digunakan untuk login di mobile scanner saat pemeriksaan tiket pengunjung.
                </p>
              </div>
              <button
                onClick={() => { setStaffRole('gate_staff'); setAddStaffOpen(true); }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Gate Staff
              </button>
            </div>

            {staffLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Memuat data staff...</div>
            ) : gateStaffMembers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Belum ada gate staff yang ditugaskan untuk event ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {gateStaffMembers.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{s.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">
                        Gate Staff
                      </span>
                      <button
                        onClick={() => handleRemoveStaff(s.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'vendors' ? (
        /* Vendor Management Section */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-600" />
                  Pengelolaan Akun Vendor Booth
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftarkan vendor booth (F&amp;B / Merchandise). Akun vendor digunakan untuk transaksi cashless wristband di venue.
                </p>
              </div>
              <button
                onClick={() => { setStaffRole('vendor'); setAddStaffOpen(true); }}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-md shadow-amber-600/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Akun Vendor
              </button>
            </div>

            {staffLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Memuat data vendor...</div>
            ) : vendorMembers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Belum ada vendor booth yang ditugaskan untuk event ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {vendorMembers.map((s) => (
                  <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{s.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        Vendor Booth
                      </span>
                      <button
                        onClick={() => handleRemoveStaff(s.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-slate-400 text-sm animate-pulse font-medium">Memuat metrik dashboard...</div>
      ) : metrics ? (
        <div className="space-y-8">
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
              sub="vs total kuota tiket"
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
                  label="Occupancy Rate (Tiket Terjual)"
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
                Scan Gate Terakhir
              </h2>
              {(() => {
                const scanLogs = metrics.recent_scan_logs || metrics.gate_scan_logs_recent || [];
                if (scanLogs.length === 0) {
                  return <div className="text-center py-8 text-xs text-slate-400 font-medium">Belum ada aktivitas scan gate.</div>;
                }
                return (
                  <div className="space-y-2">
                    {scanLogs.map((log: any, idx: number) => (
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
                );
              })()}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              Transaksi Terakhir
            </h2>
            {(() => {
              const orders = metrics.recent_orders || [];
              if (orders.length === 0) {
                return <div className="text-center py-6 text-xs text-slate-400 font-medium">Belum ada transaksi.</div>;
              }
              return (
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
                      {orders.map((order: any) => (
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
                            Rp {order.amount?.toLocaleString('id-ID') ?? 0}
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
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-slate-500 text-sm font-medium">
          Gagal memuat metrik. Pastikan backend sedang berjalan.
        </div>
      )}

      {/* Add Staff / Vendor Modal */}
      {addStaffOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {staffRole === 'vendor' ? 'Tambah Akun Vendor' : 'Tambah Gate Staff Baru'}
              </h3>
              <button onClick={() => setAddStaffOpen(false)} className="text-slate-400 font-bold text-sm">
                ✕
              </button>
            </div>

            {staffError && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold">{staffError}</div>}

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={staffRole === 'vendor' ? 'Vendor Snack & Beverage' : 'Rudi Gate Staff'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Login</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder={staffRole === 'vendor' ? 'vendor@soundwave.com' : 'rudi@gate.com'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                />
              </div>
              <button
                type="submit"
                className={`w-full py-2.5 rounded-xl text-white font-bold text-xs mt-2 ${
                  staffRole === 'vendor' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                Simpan &amp; Beri Akses
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
