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
  ShieldCheck,
  CreditCard,
  AlertCircle,
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

  // SaaS Staff Fee states
  const [staffFeePaid, setStaffFeePaid] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payingFee, setPayingFee] = useState(false);
  const [pendingRole, setPendingRole] = useState<'gate_staff' | 'vendor'>('gate_staff');
  const [payError, setPayError] = useState('');

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

  const fetchStaffFeeStatus = useCallback(async (eventId: string | null) => {
    if (!eventId) {
      setStaffFeePaid(false);
      return;
    }
    try {
      const res = await api.get(`/events/${eventId}/staff-fee-status`);
      if (res.data.success) {
        setStaffFeePaid(Boolean(res.data.data.staff_fee_paid));
      }
    } catch {
      // Quiet fallback
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
    const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('wl_token') : null);
    const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('wl_user') : null;
    let currentUser = user;
    if (!currentUser && storedUserStr) {
      try {
        currentUser = JSON.parse(storedUserStr);
      } catch {}
    }

    if (!currentToken) {
      router.replace('/login');
      return;
    }

    if (currentUser && currentUser.role !== 'organizer' && currentUser.role !== 'admin') {
      router.replace('/');
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
      fetchStaffFeeStatus(selectedEventId);
    }
  }, [selectedEventId, fetchStaff, fetchStaffFeeStatus]);

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
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Gagal mengekspor data Excel. Pastikan backend aktif.');
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

  const handlePayStaffFee = async () => {
    if (!selectedEventId) return;
    setPayingFee(true);
    setPayError('');
    try {
      const res = await api.post(`/events/${selectedEventId}/staff-fee-order`);
      if (res.data.success) {
        const orderData = res.data.data;
        const { snap_token, redirect_url } = orderData;

        // Ensure snap script is injected
        if (typeof window !== 'undefined' && !(window as any).snap) {
          await new Promise<void>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
            script.setAttribute(
              'data-client-key',
              process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-sample'
            );
            script.onload = () => resolve();
            script.onerror = () => resolve();
            document.body.appendChild(script);
          });
        }

        const completePayment = async () => {
          await api.post(`/events/${selectedEventId}/staff-fee-confirm`);
          setStaffFeePaid(true);
          setPayModalOpen(false);
          setStaffRole(pendingRole);
          setAddStaffOpen(true);
        };

        if (typeof window !== 'undefined' && (window as any).snap) {
          (window as any).snap.pay(snap_token, {
            onSuccess: async () => {
              await completePayment();
            },
            onPending: async () => {
              await completePayment();
            },
            onError: () => {
              setPayError('Pembayaran Midtrans gagal atau dibatalkan.');
            },
            onClose: () => {
              setPayingFee(false);
            },
          });
        } else if (redirect_url) {
          window.location.href = redirect_url;
        } else {
          await completePayment();
        }
      }
    } catch (err: any) {
      setPayError(err.response?.data?.message || 'Gagal memproses pembayaran aktivasi staff.');
    } finally {
      setPayingFee(false);
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-full overflow-x-hidden">
      {/* Page Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2 tracking-tight">
            <LayoutDashboard className="w-6 h-6 text-zinc-900" />
            Organizer Dashboard
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Pantau metrik penjualan tiket, kelola petugas gate scanner, dan orkestrasi event Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Kelola Event Button */}
          <button
            onClick={() => router.push('/dashboard/events')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs tactile-btn"
          >
            <Calendar className="w-3.5 h-3.5" />
            Kelola Event ({myEvents.length})
          </button>

          {/* Event Selector */}
          {myEvents.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white border border-zinc-200 rounded-xl px-3 py-1.5 shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="text-xs font-bold text-zinc-800 bg-transparent border-none focus:outline-none cursor-pointer"
              >
                {myEvents.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {evt.name} ({evt.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all tactile-btn ${
                activeTab === 'analytics' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Beranda &amp; Analytics
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all tactile-btn ${
                activeTab === 'staff' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              Gate Staff ({gateStaffMembers.length})
            </button>
            <button
              onClick={() => setActiveTab('vendors')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all tactile-btn ${
                activeTab === 'vendors' ? 'bg-white text-zinc-950 shadow-2xs' : 'text-zinc-500 hover:text-zinc-900'
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 tactile-btn"
            >
              {exportingType ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-zinc-300" />
              )}
              <span>{exportingType ? 'Mengekspor...' : 'Export Excel'}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl z-30 py-1.5 text-xs animate-fadeIn">
                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                  Pilih Format Laporan
                </div>
                <button
                  onClick={() => handleExportExcel('sales', 'laporan-penjualan')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-50 text-zinc-800 font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-zinc-700" />
                  <span>Laporan Penjualan Tiket</span>
                </button>
                <button
                  onClick={() => handleExportExcel('gate-logs', 'log-gate-checkin')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-50 text-zinc-800 font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Log Gate Scan Check-In</span>
                </button>
                <button
                  onClick={() => handleExportExcel('booth-transactions', 'transaksi-booth')}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-zinc-50 text-zinc-800 font-semibold flex items-center gap-2 transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-zinc-700" />
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors shadow-2xs tactile-btn"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* No Events Banner */}
      {!eventsLoading && myEvents.length === 0 && (
        <div className="bg-zinc-950 rounded-3xl p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs border border-zinc-800">
          <div className="space-y-2 text-center sm:text-left">
            <h2 className="text-xl font-extrabold tracking-tight">Anda Belum Memiliki Event</h2>
            <p className="text-zinc-400 text-xs max-w-md">
              Buat event pertama Anda, atur tier tiket, jadwal penjualan, serta tugaskan petugas gate scanner.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/events')}
            className="px-6 py-3 rounded-xl bg-white text-zinc-950 font-black text-xs hover:bg-zinc-100 shadow-xs transition-all flex items-center gap-2 shrink-0 tactile-btn"
          >
            <Plus className="w-4 h-4" />
            Buat Event Sekarang <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeTab === 'staff' ? (
        /* Staff Management Section */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-zinc-900" />
                  Pengelolaan Akun Gate Staff Event
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedEvent
                    ? `Daftarkan gate staff untuk event "${selectedEvent.name}". Gate staff hanya dapat memindai tiket untuk event ini.`
                    : 'Pilih event terlebih dahulu untuk mengelola petugas gate staff.'}
                </p>
              </div>
              <button
                disabled={!selectedEventId}
                onClick={() => {
                  if (!staffFeePaid) {
                    setPendingRole('gate_staff');
                    setPayModalOpen(true);
                  } else {
                    setStaffRole('gate_staff');
                    setAddStaffOpen(true);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 shadow-xs flex items-center gap-1.5 disabled:opacity-50 tactile-btn"
              >
                <Plus className="w-4 h-4" />
                Tambah Gate Staff
              </button>
            </div>

            {selectedEventId && (
              staffFeePaid ? (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Layanan Staff SaaS Teraktivasi — Akses penambahan Gate Staff &amp; POS Vendor aktif tanpa batas untuk event ini.</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-100 text-zinc-900 rounded-xl border border-zinc-200">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wide">Aktivasi Fitur Staff Event (SaaS)</h4>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Biaya 1x Rp 50.000 via Midtrans per event untuk mengaktifkan manajemen Gate Staff &amp; Vendor.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPendingRole('gate_staff');
                      setPayModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs shrink-0 transition tactile-btn"
                  >
                    Bayar Aktivasi (Rp 50.000)
                  </button>
                </div>
              )
            )}

            {!selectedEventId ? (
              <div className="text-center py-10 text-xs text-zinc-400 font-medium">
                Silakan buat event terlebih dahulu untuk menugaskan gate staff.
              </div>
            ) : staffLoading ? (
              <div className="text-center py-10 text-xs text-zinc-400 font-medium">Memuat data staff...</div>
            ) : gateStaffMembers.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-400 font-medium">
                Belum ada gate staff yang ditugaskan untuk event ini.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden">
                {gateStaffMembers.map((s) => (
                  <div key={s.id || s.user_id} className="p-4 flex items-center justify-between hover:bg-zinc-50">
                    <div>
                      <span className="font-extrabold text-sm text-zinc-950 block">{s.name}</span>
                      <span className="text-xs text-zinc-400 font-mono">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 text-[10px] font-bold uppercase font-mono">
                        Gate Staff
                      </span>
                      <button
                        onClick={() => handleRemoveStaff(s.user_id || s.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 tactile-btn"
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
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
                  <Store className="w-5 h-5 text-zinc-900" />
                  Pengelolaan Akun Vendor Booth
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {selectedEvent
                    ? `Daftarkan vendor booth untuk event "${selectedEvent.name}".`
                    : 'Pilih event terlebih dahulu untuk mengelola vendor.'}
                </p>
              </div>
              <button
                disabled={!selectedEventId}
                onClick={() => {
                  if (!staffFeePaid) {
                    setPendingRole('vendor');
                    setPayModalOpen(true);
                  } else {
                    setStaffRole('vendor');
                    setAddStaffOpen(true);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 shadow-xs flex items-center gap-1.5 disabled:opacity-50 tactile-btn"
              >
                <Plus className="w-4 h-4" />
                Tambah Akun Vendor
              </button>
            </div>

            {selectedEventId && (
              staffFeePaid ? (
                <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Layanan Staff SaaS Teraktivasi — Akses penambahan Gate Staff &amp; POS Vendor aktif tanpa batas untuk event ini.</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-100 text-zinc-900 rounded-xl border border-zinc-200">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-zinc-950 uppercase tracking-wide">Aktivasi Fitur Staff Event (SaaS)</h4>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Biaya 1x Rp 50.000 via Midtrans per event untuk mengaktifkan manajemen Gate Staff &amp; Vendor.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setPendingRole('vendor');
                      setPayModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs shrink-0 transition tactile-btn"
                  >
                    Bayar Aktivasi (Rp 50.000)
                  </button>
                </div>
              )
            )}

            {!selectedEventId ? (
              <div className="text-center py-10 text-xs text-zinc-400 font-medium">
                Silakan buat event terlebih dahulu untuk menugaskan vendor.
              </div>
            ) : staffLoading ? (
              <div className="text-center py-10 text-xs text-zinc-400 font-medium">Memuat data vendor...</div>
            ) : vendorMembers.length === 0 ? (
              <div className="text-center py-10 text-xs text-zinc-400 font-medium">
                Belum ada vendor booth yang ditugaskan untuk event ini.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 border border-zinc-100 rounded-2xl overflow-hidden">
                {vendorMembers.map((s) => (
                  <div key={s.id || s.user_id} className="p-4 flex items-center justify-between hover:bg-zinc-50">
                    <div>
                      <span className="font-extrabold text-sm text-zinc-950 block">{s.name}</span>
                      <span className="text-xs text-zinc-400 font-mono">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-900 border border-zinc-200 text-[10px] font-bold uppercase font-mono">
                        Vendor Booth
                      </span>
                      <button
                        onClick={() => handleRemoveStaff(s.user_id || s.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 tactile-btn"
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
        <div className="text-center py-20 text-zinc-400 text-xs animate-pulse font-medium">Memuat metrik dashboard...</div>
      ) : metrics ? (
        <div className="space-y-8">
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={CircleDollarSign}
              label="Total Revenue"
              value={`Rp ${(metrics.total_revenue / 1000000).toFixed(1)}jt`}
              sub={`${metrics.total_tickets_sold} tiket terjual`}
            />
            <KpiCard
              icon={Ticket}
              label="Tiket Terjual"
              value={String(metrics.total_tickets_sold)}
              sub={`${metrics.total_events} event aktif`}
            />
            <KpiCard
              icon={QrCode}
              label="Check-in Gate"
              value={String(metrics.total_scanned)}
              sub={`${metrics.checkin_rate_percent}% dari tiket terjual`}
            />
            <KpiCard
              icon={Activity}
              label="Occupancy Rate"
              value={`${metrics.occupancy_rate_percent}%`}
              sub="vs total kuota tiket"
            />
          </div>

          {/* Occupancy & Check-in Rate Bars */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-5 shadow-2xs">
              <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 tracking-tight">
                <TrendingUp className="w-4 h-4 text-zinc-900" />
                Tingkat Occupancy &amp; Check-In
              </h2>
              <div className="space-y-4">
                <OccupancyBar
                  label="Occupancy Rate (Tiket Terjual)"
                  percent={metrics.occupancy_rate_percent}
                />
                <OccupancyBar
                  label="Gate Check-In Rate"
                  percent={metrics.checkin_rate_percent}
                />
              </div>

              <div className="pt-2 border-t border-zinc-100 text-xs font-medium text-zinc-400">
                Data diperbarui setiap 30 detik secara otomatis.
              </div>
            </div>

            {/* Recent Gate Scans */}
            <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
              <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 tracking-tight">
                <QrCode className="w-4 h-4 text-zinc-900" />
                Scan Gate Terakhir
              </h2>
              {(() => {
                const scanLogs = metrics.recent_scan_logs || metrics.gate_scan_logs_recent || [];
                if (scanLogs.length === 0) {
                  return <div className="text-center py-8 text-xs text-zinc-400 font-medium">Belum ada aktivitas scan gate.</div>;
                }
                return (
                  <div className="space-y-2">
                    {scanLogs.map((log: any, idx: number) => (
                      <div
                        key={log.id || idx}
                        className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-100 text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-zinc-950 block font-mono">{log.ticket_id}</span>
                          <span className="text-zinc-400 font-mono text-[11px]">
                            {new Date(log.scanned_at).toLocaleTimeString('id-ID')}
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            log.result === 'valid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : log.result === 'duplicate'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200'
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
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-100">
              <div>
                <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 tracking-tight">
                  <Calendar className="w-4 h-4 text-zinc-900" />
                  Daftar Event Anda ({myEvents.length})
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Kelola informasi event, tier tiket, jadwal sesi, dan status publikasi.
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/events')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto tactile-btn"
              >
                <Plus className="w-4 h-4" />
                Buat &amp; Kelola Event
              </button>
            </div>

            {myEvents.length === 0 ? (
              <div className="text-center py-8 text-xs text-zinc-400 font-medium">
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
                          ? 'border-zinc-950 bg-zinc-50 shadow-2xs'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            evt.status === 'published'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {evt.status}
                        </span>
                        <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                          {evt.category}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-xs text-zinc-950 line-clamp-1 mb-1">{evt.name}</h3>
                      <p className="text-[11px] text-zinc-500 line-clamp-1 mb-3">{evt.location}</p>

                      <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                        <button
                          onClick={() => {
                            setSelectedEventId(evt.id);
                            setActiveTab('staff');
                          }}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-[11px] font-bold text-zinc-700 transition text-center tactile-btn"
                        >
                          Kelola Staff
                        </button>
                        <button
                          onClick={() => router.push('/dashboard/events')}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[11px] font-bold transition text-center tactile-btn"
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
          <div className="bg-white rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xs">
            <h2 className="text-sm font-extrabold text-zinc-950 flex items-center gap-2 tracking-tight">
              <CheckCircle2 className="w-4 h-4 text-zinc-900" />
              Transaksi Terakhir
            </h2>
            {(() => {
              const orders = metrics.recent_orders || [];
              if (orders.length === 0) {
                return <div className="text-center py-6 text-xs text-zinc-400 font-medium">Belum ada transaksi.</div>;
              }
              return (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-100 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        <th className="pb-2 pr-4">Order ID</th>
                        <th className="pb-2 pr-4">Gateway</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4">Total</th>
                        <th className="pb-2">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {orders.map((order: any) => (
                        <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-2.5 pr-4 font-mono text-zinc-800 font-bold">{order.id}</td>
                          <td className="py-2.5 pr-4 text-zinc-600 font-medium">{order.payment_gateway}</td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                                order.status === 'paid'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : order.status === 'pending'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 font-bold text-zinc-950 font-mono">
                            Rp {order.amount?.toLocaleString('id-ID') ?? 0}
                          </td>
                          <td className="py-2.5 text-zinc-400 font-medium font-mono">
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
        <div className="text-center py-20 text-zinc-500 text-xs font-medium">
          Gagal memuat metrik. Pastikan backend sedang berjalan.
        </div>
      )}

      {/* Add Staff / Vendor Modal */}
      {addStaffOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-zinc-950">
                {staffRole === 'vendor' ? 'Tambah Akun Vendor' : 'Tambah Gate Staff Baru'}
              </h3>
              <button onClick={() => setAddStaffOpen(false)} className="text-zinc-400 hover:text-zinc-700 font-bold text-sm">
                ✕
              </button>
            </div>

            {staffError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">{staffError}</div>}

            <form onSubmit={handleAddStaff} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama</label>
                <input
                  type="text"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  placeholder={staffRole === 'vendor' ? 'Vendor Snack & Beverage' : 'Rudi Gate Staff'}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Email Login</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder={staffRole === 'vendor' ? 'vendor@soundwave.com' : 'rudi@gate.com'}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-zinc-700 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  value={staffPassword}
                  onChange={(e) => setStaffPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs mt-2 bg-zinc-950 hover:bg-zinc-800 transition tactile-btn shadow-xs"
              >
                Simpan &amp; Beri Akses
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SaaS Event Staff Feature Activation Modal */}
      {payModalOpen && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 space-y-6 animate-scaleUp">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-zinc-100 border border-zinc-200 rounded-2xl text-zinc-950">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-950 tracking-tight">Aktivasi Fitur Staff Event</h3>
                  <p className="text-xs text-zinc-500 font-medium">WhiteLabel SaaS Event Management</p>
                </div>
              </div>
              <button
                onClick={() => setPayModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-700 font-bold text-base p-1"
              >
                ✕
              </button>
            </div>

            {payError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{payError}</span>
              </div>
            )}

            <div className="bg-zinc-50 rounded-2xl p-4 border border-zinc-200 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 font-medium">Event:</span>
                <span className="font-bold text-zinc-950">{selectedEvent?.name || 'Event Terpilih'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 font-medium">Biaya Aktivasi (1x per Event):</span>
                <span className="font-black text-sm text-zinc-950 font-mono">Rp 50.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Metode Pembayaran:</span>
                <span className="font-bold text-zinc-800">Midtrans (QRIS, VA, CC, E-Wallet)</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-zinc-600">
              <span className="font-bold text-zinc-950 block uppercase tracking-wider text-[10px]">Benefit Aktivasi Staff Event:</span>
              <ul className="space-y-1 text-[11px] list-disc list-inside text-zinc-500 font-medium">
                <li>Akses penambahan akun Gate Staff tanpa batasan jumlah</li>
                <li>Akses penambahan akun Kasir Vendor Booth</li>
                <li>Sinkronisasi pemindaian barcode gate scanner multi-perangkat</li>
                <li>Laporan kehadiran (check-in rate) &amp; analitik booth real-time</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPayModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition tactile-btn"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={payingFee}
                onClick={handlePayStaffFee}
                className="flex-1 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50 tactile-btn"
              >
                {payingFee ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                <span>{payingFee ? 'Memproses...' : 'Bayar Rp 50.000'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
