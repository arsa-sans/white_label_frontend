'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface OrganizerUser {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  role: string;
  approval_status: 'approved' | 'pending' | 'rejected';
  nik?: string;
  company_name?: string;
  organizer_event_name?: string;
  organizer_event_date?: string;
  organizer_event_location?: string;
  organizer_event_description?: string;
  portfolio_url?: string;
  npwp?: string;
}

export default function AdminOrganizersPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [organizers, setOrganizers] = useState<OrganizerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [reviewingUser, setReviewingUser] = useState<OrganizerUser | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

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
    fetchOrganizers();
  }, [user, token, router]);

  const fetchOrganizers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/organizers');
      if (res.data.success) {
        setOrganizers(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (userId: string, status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      const res = await api.patch(`/admin/organizers/${userId}/review`, {
        approval_status: status,
        reason: status === 'rejected' ? rejectReason : undefined,
      });

      if (res.data.success) {
        setReviewingUser(null);
        setRejectReason('');
        fetchOrganizers();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Gagal memproses verifikasi organizer.');
    } finally {
      setProcessing(false);
    }
  };

  const filtered = organizers.filter((o) => filter === 'all' || o.approval_status === filter);

  if (loading) return <LoadingSpinner message="Memuat antrean verifikasi organizer..." />;

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
            <ShieldCheck className="w-6 h-6 text-zinc-900" />
            Antrean Verifikasi Legalitas Organizer (KYC)
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Tinjau identitas, portofolio event, NPWP, dan NIK organizer sebelum menerbitkan izin penjualan tiket.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-3">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
          const count = organizers.filter((o) => tab === 'all' || o.approval_status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors flex items-center gap-1.5 tactile-btn ${
                filter === tab
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              <span>{tab === 'all' ? 'Semua Permohonan' : tab}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Organizer Cards List */}
      <div className="space-y-4">
        {filtered.map((org) => (
          <div
            key={org.id}
            className="bg-white rounded-3xl border border-zinc-200 p-6 shadow-2xs hover:shadow-xs transition flex flex-col lg:flex-row justify-between gap-6"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                    org.approval_status === 'approved'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : org.approval_status === 'pending'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }`}
                >
                  {org.approval_status === 'approved' ? (
                    <><CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved</>
                  ) : org.approval_status === 'pending' ? (
                    <><Clock className="w-3 h-3 text-amber-600" /> Pending Review</>
                  ) : (
                    <><XCircle className="w-3 h-3 text-red-600" /> Rejected</>
                  )}
                </span>
                <span className="text-xs font-bold text-zinc-400 font-mono">Tenant: {org.tenant_id}</span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-zinc-950 tracking-tight">{org.name}</h3>
                <p className="text-xs text-zinc-500 font-mono">{org.email}</p>
              </div>

              {/* KYC Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-zinc-100">
                <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Perusahaan</span>
                  <span className="font-bold text-zinc-800">{org.company_name || 'Personal / EO'}</span>
                </div>
                <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">NIK Pemohon</span>
                  <span className="font-mono text-zinc-800 font-semibold">{org.nik || '-'}</span>
                </div>
                <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">NPWP</span>
                  <span className="font-mono text-zinc-800 font-semibold">{org.npwp || '-'}</span>
                </div>
                <div className="bg-zinc-50 rounded-xl p-2.5 border border-zinc-100">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Portofolio</span>
                  {org.portfolio_url ? (
                    <a
                      href={org.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-950 font-bold hover:underline flex items-center gap-1"
                    >
                      Buka Link <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </div>
              </div>

              {org.organizer_event_name && (
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-900 space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 block">
                    Rencana Event Yang Diajukan:
                  </span>
                  <p className="font-extrabold text-zinc-950">{org.organizer_event_name}</p>
                  {org.organizer_event_description && (
                    <p className="text-zinc-600 text-[11px] leading-relaxed">
                      {org.organizer_event_description}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-center gap-2 min-w-[180px]">
              {org.approval_status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleReview(org.id, 'approved')}
                    disabled={processing}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 tactile-btn"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Setujui Izin
                  </button>
                  <button
                    onClick={() => setReviewingUser(org)}
                    disabled={processing}
                    className="w-full py-2.5 px-4 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition flex items-center justify-center gap-1.5 tactile-btn"
                  >
                    <XCircle className="w-4 h-4" /> Tolak Izin
                  </button>
                </>
              ) : (
                <button
                  onClick={() =>
                    handleReview(org.id, org.approval_status === 'approved' ? 'rejected' : 'approved')
                  }
                  disabled={processing}
                  className="w-full py-2 px-3 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 text-xs font-bold transition tactile-btn"
                >
                  Ubah ke {org.approval_status === 'approved' ? 'Tolak' : 'Setujui'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject Modal with Reason */}
      {reviewingUser && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 border border-zinc-200">
            <h2 className="text-base font-extrabold text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Tolak Izin Organizer
            </h2>
            <p className="text-xs text-zinc-500">
              Berikan alasan penolakan agar pemohon {reviewingUser.name} ({reviewingUser.email}) dapat memperbaiki dokumen kelengkapannya.
            </p>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Alasan Penolakan</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Contoh: Dokumen NIK tidak terbaca jelas atau portofolio belum memadai."
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs text-zinc-900 focus:ring-2 focus:ring-zinc-950 focus:bg-white resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition tactile-btn"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReview(reviewingUser.id, 'rejected')}
                disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 tactile-btn"
              >
                {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Konfirmasi Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
