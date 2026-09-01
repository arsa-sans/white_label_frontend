'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  Ticket,
  QrCode,
  RefreshCw,
  CircleDollarSign,
  Activity,
  CheckCircle2,
  Store,
  UserCheck,
  Plus,
  Trash2,
  Calendar,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import KpiCard from '@/components/dashboard/KpiCard';
import OccupancyBar from '@/components/dashboard/OccupancyBar';

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

interface EventOption {
  id: string;
  name: string;
  category: string;
  location: string;
  status: string;
}

export default function DashboardPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Events list & selector
  const [myEvents, setMyEvents] = useState<EventOption[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Tab state: 'analytics' | 'staff' | 'vendors'
  const [activeTab, setActiveTab] = useState<'analytics' | 'staff' | 'vendors'>('analytics');

  // Export dropdown state
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingType, setExportingType] = useState<string | null>(null);

  // Staff management states
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [addStaffOpen, setAddStaffOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState<'gate_staff' | 'vendor'>('gate_staff');
  const [staffError, setStaffError] = useState('');

  const fetchEvents = useCallback(async () => {
    setEventsLoading(true);
    try {
      const res = await api.get('/events/me');
      if (res.data.success) {
        const list: EventOption[] = res.data.data;
        setMyEvents(list);
        if (list.length > 0) {
          setSelectedEventId((prev) => (prev && list.some((e) => e.id === prev) ? prev : list[0].id));
        } else {
          setSelectedEventId(null);
        }
      }
    } catch {
      // Quiet error
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await api.get('/analytics/dashboard');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch {
      // Quiet error
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStaff = useCallback(async (eventId: string | null) => {
    if (!eventId) {
      setStaffList([]);
      return;
    }
    setStaffLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/staff`);
      if (res.data.success) {
        setStaffList(res.data.data);
      }
    } catch {
      // Quiet error
    } finally {
      setStaffLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    if (user && user.role !== 'organizer' && user.role !== 'admin') {
      router.replace('/events');
      return;
    }

    fetchEvents();
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [user, token, router, fetchEvents, fetchMetrics]);

  useEffect(() => {
    if (selectedEventId) {
      fetchStaff(selectedEventId);
    }
  }, [selectedEventId, fetchStaff]);

  const handleExportExcel = async (type: 'sales' | 'gate-logs' | 'booth-transactions', filename: string) => {
    setExportingType(type);
    setShowExportMenu(false);
    try {
      const res = await api.get(`/analytics/export/${type}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengekspor laporan Excel. Pastikan data tersedia.');
    } finally {
      setExportingType(null);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) {
      setStaffError('Pilih event terlebih dahulu');
      return;
    }
    if (!staffName || !staffEmail || !staffPassword) {
      setStaffError('Semua kolom wajib diisi');
      return;
    }

    setStaffError('');
    try {
      const res = await api.post(`/events/${selectedEventId}/staff`, {
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
    if (!selectedEventId) return;
    try {
      const res = await api.delete(`/events/${selectedEventId}/staff/${staffId}`);
      if (res.data.success) {
        setStaffList((prev) => prev.filter((s) => s.id !== staffId && s.user_id !== staffId));
      }
    } catch {
      // Quiet error
    }
  };

  const gateStaffMembers = staffList.filter((s) => s.role === 'gate_staff' || !s.role);
  const vendorMembers = staffList.filter((s) => s.role === 'vendor');
  const selectedEvent = myEvents.find((e) => e.id === selectedEventId);

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
            Pantau metrik penjualan tiket, kelola petugas gate staff, dan kelola event Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kelola Event Button */}
          <button
            onClick={() => router.push('/dashboard/events')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
          >
            <Calendar className="w-3.5 h-3.5" />
            Kelola / Buat Event ({myEvents.length})
          </button>

          {/* Event Selector */}
          {myEvents.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {myEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} ({evt.status})
                  </option>
                ))}
              </select>
            </div>
          )}

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
              Gate Staff ({gateStaffMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'vendors' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Vendor ({vendorMembers.length})
            </button>
          </div>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={exportingType !== null}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {exportingType ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{exportingType ? 'Mengekspor...' : 'Export Excel'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 py-1.5 text-xs animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  Pilih Format Laporan
                </div>
                <button
                  onClick={() => handleExportExcel('sales', 'laporan-penjualan')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                  <span>Laporan Penjualan Tiket</span>
                </button>
                <button
                  onClick={() => handleExportExcel('gate-logs', 'log-gate-checkin')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Log Gate Scan Check-In</span>
                </button>
                <button
                  onClick={() => handleExportExcel('booth-transactions', 'transaksi-booth')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>Transaksi Booth Vendor</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              fetchEvents();
              fetchMetrics();
              if (selectedEventId) fetchStaff(selectedEventId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* No Events Banner */}
      {!eventsLoading && myEvents.length === 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-xl font-extrabold">Anda Belum Memiliki Event</h2>
            <p className="text-indigo-100 text-xs max-w-md">
              Buat event pertama Anda, atur tier tiket, jadwal penjualan, serta tugaskan petugas gate staff.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/events')}
            className="px-6 py-3 rounded-2xl bg-white text-indigo-600 font-black text-xs hover:bg-indigo-50 shadow-lg transition-all flex items-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Buat Event Sekarang <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'staff' ? (
        /* Staff Management Section */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  Pengelolaan Akun Gate Staff Event
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedEvent
                    ? `Daftarkan gate staff untuk event "${selectedEvent.name}". Gate staff hanya dapat memindai tiket untuk event ini.`
                    : 'Pilih event terlebih dahulu untuk mengelola petugas gate staff.'}
                </p>
              </div>
              <button
                disabled={!selectedEventId}
                onClick={() => {
                  setStaffRole('gate_staff');
                  setAddStaffOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Tambah Gate Staff
              </button>
            </div>

            {!selectedEventId ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Silakan buat event terlebih dahulu untuk menugaskan gate staff.
              </div>
            ) : staffLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Memuat data staff...</div>
            ) : gateStaffMembers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Belum ada gate staff yang ditugaskan untuk event ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {gateStaffMembers.map((s) => (
                  <div key={s.id || s.user_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{s.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase">
                        Gate Staff
                      </span>
                      <button
                        onClick={() => handleRemoveStaff(s.user_id || s.id)}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-amber-600" />
                  Pengelolaan Akun Vendor Booth
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedEvent
                    ? `Daftarkan vendor booth untuk event "${selectedEvent.name}".`
                    : 'Pilih event terlebih dahulu untuk mengelola vendor.'}
                </p>
              </div>
              <button
                disabled={!selectedEventId}
                onClick={() => {
                  setStaffRole('vendor');
                  setAddStaffOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 shadow-md shadow-amber-600/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Tambah Akun Vendor
              </button>
            </div>

            {!selectedEventId ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Silakan buat event terlebih dahulu untuk menugaskan vendor.
              </div>
            ) : staffLoading ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">Memuat data vendor...</div>
            ) : vendorMembers.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-medium">
                Belum ada vendor booth yang ditugaskan untuk event ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {vendorMembers.map((s) => (
                  <div key={s.id || s.user_id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-extrabold text-sm text-slate-900 block">{s.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        Vendor Booth
                      </span>
                      <button
                        onClick={() => handleRemoveStaff(s.user_id || s.id)}
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
            <KpiCard
              icon={CircleDollarSign}
              label="Total Revenue"
              value={`Rp ${(metrics.total_revenue / 1000000).toFixed(1)}jt`}
              sub={`${metrics.total_tickets_sold} tiket terjual`}
              color="bg-indigo-50 text-indigo-700 border border-indigo-100"
            />
            <KpiCard
              icon={Ticket}
              label="Tiket Terjual"
              value={String(metrics.total_tickets_sold)}
              sub={`${metrics.total_events} event aktif`}
              color="bg-cyan-50 text-cyan-700 border border-cyan-100"
            />
            <KpiCard
              icon={QrCode}
              label="Check-in Gate"
              value={String(metrics.total_scanned)}
              sub={`${metrics.checkin_rate_percent}% dari tiket sold`}
              color="bg-emerald-50 text-emerald-700 border border-emerald-100"
            />
            <KpiCard
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

          {/* Organizer Events Overview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Daftar Event Anda ({myEvents.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola informasi event, tier tiket, jadwal sesi, dan status publikasi.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/events')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Buat &amp; Kelola Event
              </button>
            </div>

            {myEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400 font-medium">
                Belum ada event. Klik &ldquo;Buat &amp; Kelola Event&rdquo; untuk menambahkan event pertama Anda.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {myEvents.map((evt) => {
                  const isCurrent = evt.id === selectedEventId;
                  return (
                    <div
                      key={evt.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-indigo-300 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            evt.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {evt.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                          {evt.category}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-xs text-slate-900 line-clamp-1 mb-1">{evt.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mb-3">{evt.location}</p>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setSelectedEventId(evt.id);
                            setActiveTab('staff');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-[11px] font-bold text-slate-700 hover:text-indigo-600 transition text-center"
                        >
                          Kelola Staff
                        </button>
                        <button
                          onClick={() => router.push('/dashboard/events')}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold transition text-center"
                        >
                          Kelola Tiket &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
