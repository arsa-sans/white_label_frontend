'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Briefcase,
  FileText,
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
    if (!token || (user && user.role !== 'admin')) {
      router.replace('/');
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Super Admin Dashboard
          </Link>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Antrean Verifikasi Legalitas Organizer (KYC)
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Tinjau identitas, portofolio event, NPWP, dan NIK organizer sebelum menerbitkan izin penjualan tiket.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
          const count = organizers.filter((o) => tab === 'all' || o.approval_status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors flex items-center gap-1.5 ${
                filter === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
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
            className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col lg:flex-row justify-between gap-6"
          >
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border flex items-center gap-1 ${
                    org.approval_status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : org.approval_status === 'pending'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}
                >
                  {org.approval_status === 'approved' ? (
                    <><CheckCircle2 className="w-3 h-3" /> Approved</>
                  ) : org.approval_status === 'pending' ? (
                    <><Clock className="w-3 h-3" /> Pending Review</>
                  ) : (
                    <><XCircle className="w-3 h-3" /> Rejected</>
                  )}
                </span>
                <span className="text-xs font-bold text-slate-400">Tenant: {org.tenant_id}</span>
              </div>

              <div>
                <h3 className="text-base font-extrabold text-slate-900">{org.name}</h3>
                <p className="text-xs text-slate-500 font-mono">{org.email}</p>
              </div>

              {/* KYC Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Perusahaan</span>
                  <span className="font-bold text-slate-700">{org.company_name || 'Personal / EO'}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">NIK Pemohon</span>
                  <span className="font-mono text-slate-700 font-semibold">{org.nik || '-'}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">NPWP</span>
                  <span className="font-mono text-slate-700 font-semibold">{org.npwp || '-'}</span>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Portofolio</span>
                  {org.portfolio_url ? (
                    <a
                      href={org.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                    >
                      Buka Link <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </div>
              </div>

              {org.organizer_event_name && (
                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider text-indigo-600 block">
                    Rencana Event Yang Diajukan:
                  </span>
                  <p className="font-extrabold">{org.organizer_event_name}</p>
                  {org.organizer_event_description && (
                    <p className="text-slate-600 text-[11px] leading-relaxed">
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
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Setujui Izin
                  </button>
                  <button
                    onClick={() => setReviewingUser(org)}
                    disabled={processing}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold transition flex items-center justify-center gap-1.5"
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
                  className="w-full py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition"
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fadeIn">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              Tolak Izin Organizer
            </h2>
            <p className="text-xs text-slate-500">
              Berikan alasan penolakan agar pemohon {reviewingUser.name} ({reviewingUser.email}) dapat memperbaiki dokumen kelengkapannya.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Alasan Penolakan</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Contoh: Dokumen NIK tidak terbaca jelas atau portofolio belum memadai."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReviewingUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleReview(reviewingUser.id, 'rejected')}
                disabled={processing}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
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
