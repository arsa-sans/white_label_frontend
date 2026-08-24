'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  Plus,
  ArrowLeft,
  Globe,
  Palette,
  Calendar,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

interface TenantItem {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  active_events_count?: number;
}

export default function AdminTenantsPage() {
  const { user, token } = useAppStore();
  const router = useRouter();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || (user && user.role !== 'admin')) {
      router.replace('/');
      return;
    }
    fetchTenants();
  }, [user, token, router]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/tenants');
      if (res.data.success) {
        setTenants(res.data.data);
      }
    } catch {
      // Quiet error handling
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subdomain) {
      setError('Nama tenant dan subdomain wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/admin/tenants', {
        name,
        subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });

      if (res.data.success) {
        setModalOpen(false);
        setName('');
        setSubdomain('');
        fetchTenants();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat tenant baru.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Memuat daftar tenant white label..." />;

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
            <Building2 className="w-6 h-6 text-indigo-600" />
            Manajemen White Label Tenants
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Kelola klien multi-tenant, domain kustom, skema warna tema, dan kuota event.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md"
        >
          <Plus className="w-4 h-4" /> Tambah Tenant Baru
        </button>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tenants.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm hover:shadow-md transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-sm shadow-md"
                  style={{ backgroundColor: t.primary_color }}
                >
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{t.name}</h3>
                  <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                    <Globe className="w-3 h-3 text-indigo-500" />
                    {t.subdomain}.whitelabel.app
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tenant ID</span>
                <span className="font-mono text-slate-700 font-bold">{t.id}</span>
              </div>
              <div className="bg-indigo-50 rounded-xl p-2.5 border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block">Event Aktif</span>
                <span className="font-bold text-indigo-800">
                  {t.active_events_count !== undefined ? t.active_events_count : 1} Published
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Tema:</span>
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 inline-block"
                  style={{ backgroundColor: t.primary_color }}
                />
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 inline-block"
                  style={{ backgroundColor: t.secondary_color }}
                />
              </div>
              <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Tenant Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-fadeIn">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Inisialisasi Tenant White Label Baru
            </h2>

            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 rounded-xl p-3 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Organisasi / Event Tenant *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Java Jazz Festival"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subdomain Unik *</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    placeholder="javajazz"
                    className="w-full px-3.5 py-2.5 rounded-l-xl border border-r-0 border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 font-mono"
                    required
                  />
                  <span className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-r-xl text-xs text-slate-500 font-mono">
                    .wl.app
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warna Utama</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-8 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warna Sekunder</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-10 h-8 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono">{secondaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Buat Tenant</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
