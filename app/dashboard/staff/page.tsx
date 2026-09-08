'use client';

/**
 * app/dashboard/staff/page.tsx
 *
 * Manajemen Petugas Gate & Vendor Booth
 *
 * Accessible: organizer, admin, superadmin.
 * Features:
 *   - Gate Staff Management (add staff, assign gate devices, view active status)
 *   - Vendor Booth Management (add booth, owner account, category, NFC reader pairing)
 *   - Quick metrics & activity status
 */

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  Store,
  Plus,
  QrCode,
  Search,
  ArrowLeft,
  ChevronRight,
  UserCheck,
  Building2,
  Trash2,
  Activity,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface GateStaff {
  id: string;
  name: string;
  email: string;
  assigned_gate: string;
  status: 'active' | 'offline';
  device_id: string;
  last_scan_at?: string;
}

interface VendorBooth {
  id: string;
  booth_name: string;
  owner_name: string;
  owner_email: string;
  category: string;
  nfc_reader_id: string;
  status: 'open' | 'closed';
  total_sales: number;
}

export default function StaffManagementPage() {
  const { user } = useAppStore();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'gate_staff' | 'vendor_booth'>('gate_staff');
  const [searchQuery, setSearchQuery] = useState('');

  // Initial Demo Data
  const [staffList, setStaffList] = useState<GateStaff[]>([
    {
      id: 'staff-001',
      name: 'Rudi Gate Staff',
      email: 'gate@soundwave.com',
      assigned_gate: 'Gate A (Main North Entrance)',
      status: 'active',
      device_id: 'GATE-DEVICE-01',
      last_scan_at: '2 min ago',
    },
    {
      id: 'staff-002',
      name: 'Siti Rahma',
      email: 'siti.gate@soundwave.com',
      assigned_gate: 'Gate B (VIP Fast Track)',
      status: 'active',
      device_id: 'GATE-DEVICE-02',
      last_scan_at: '5 min ago',
    },
    {
      id: 'staff-003',
      name: 'Budi Kurniawan',
      email: 'budi.gate@soundwave.com',
      assigned_gate: 'Gate C (South Exit & Entry)',
      status: 'offline',
      device_id: 'GATE-DEVICE-03',
      last_scan_at: '2 hours ago',
    },
  ]);

  const [boothList, setBoothList] = useState<VendorBooth[]>([
    {
      id: 'vnd-001',
      booth_name: 'Kopi Kenangan Mantan',
      owner_name: 'Andi Wijaya',
      owner_email: 'vendor1@kopi.com',
      category: 'Beverage',
      nfc_reader_id: 'NFC-READER-01',
      status: 'open',
      total_sales: 12450000,
    },
    {
      id: 'vnd-002',
      booth_name: 'Burger Bangor Feast',
      owner_name: 'Denny Sumargo',
      owner_email: 'vendor2@bangor.com',
      category: 'Food & Snacks',
      nfc_reader_id: 'NFC-READER-02',
      status: 'open',
      total_sales: 18900000,
    },
    {
      id: 'vnd-003',
      booth_name: 'Neon Merch Store',
      owner_name: 'Sarah Azhari',
      owner_email: 'merch@neonfest.com',
      category: 'Official Merchandise',
      nfc_reader_id: 'NFC-READER-03',
      status: 'open',
      total_sales: 24600000,
    },
  ]);

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', gate: 'Gate A (Main Entry)' });
  const [boothForm, setBoothForm] = useState({ name: '', owner: '', email: '', category: 'Food & Beverage' });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email) return;

    const newStaff: GateStaff = {
      id: `staff-${Date.now()}`,
      name: staffForm.name,
      email: staffForm.email,
      assigned_gate: staffForm.gate,
      status: 'active',
      device_id: `GATE-DEVICE-${Math.floor(Math.random() * 89 + 10)}`,
      last_scan_at: 'Baru dibuat',
    };

    setStaffList([newStaff, ...staffList]);
    setStaffForm({ name: '', email: '', gate: 'Gate A (Main Entry)' });
    setShowAddModal(false);
  };

  const handleAddBooth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boothForm.name || !boothForm.email) return;

    const newBooth: VendorBooth = {
      id: `vnd-${Date.now()}`,
      booth_name: boothForm.name,
      owner_name: boothForm.owner || 'Vendor Partner',
      owner_email: boothForm.email,
      category: boothForm.category,
      nfc_reader_id: `NFC-READER-${Math.floor(Math.random() * 89 + 10)}`,
      status: 'open',
      total_sales: 0,
    };

    setBoothList([newBooth, ...boothList]);
    setBoothForm({ name: '', owner: '', email: '', category: 'Food & Beverage' });
    setShowAddModal(false);
  };

  const handleDeleteStaff = (id: string) => {
    setStaffList(staffList.filter((s) => s.id !== id));
  };

  const handleDeleteBooth = (id: string) => {
    setBoothList(boothList.filter((b) => b.id !== id));
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assigned_gate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBooths = boothList.filter(
    (b) =>
      b.booth_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.owner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1 text-xs font-bold text-zinc-500 hover:text-zinc-950 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-300" />
            <span className="text-xs font-bold text-zinc-800">Petugas &amp; Booth</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-950 flex items-center gap-2 tracking-tight">
            <Users className="w-6 h-6 text-zinc-900" />
            Manajemen Petugas Gate &amp; Vendor Booth
          </h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Kelola izin akun mobile scanner gate staff dan otorisasi tenant kasir cashless venue.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-950 text-white font-bold text-xs hover:bg-zinc-800 shadow-xs transition-all tactile-btn"
        >
          <Plus className="w-4 h-4" />
          {activeTab === 'gate_staff' ? 'Tambah Petugas Gate' : 'Tambah Booth Vendor'}
        </button>
      </div>

      {/* Overview Stat Cards (Bento Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Petugas Gate</span>
            <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-950 font-mono">{staffList.length}</div>
          <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-600" />
            {staffList.filter((s) => s.status === 'active').length} Bertugas di Venue
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Booth Vendor</span>
            <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-950 font-mono">{boothList.length}</div>
          <div className="text-[11px] text-zinc-600 font-semibold font-mono">100% Cashless System</div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Titik Gate Terdaftar</span>
            <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-950 font-mono">3 Pintu</div>
          <div className="text-[11px] text-zinc-400 font-medium">Main, VIP, &amp; South Gate</div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Omset Vendor</span>
            <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-zinc-950 font-mono">
            Rp {(boothList.reduce((sum, b) => sum + b.total_sales, 0) / 1000000).toFixed(1)}jt
          </div>
          <div className="text-[11px] text-emerald-700 font-bold">F&amp;B &amp; Merchandise</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-3xl border border-zinc-200 p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('gate_staff')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 tactile-btn ${
                activeTab === 'gate_staff'
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Petugas Gate ({staffList.length})
            </button>

            <button
              onClick={() => setActiveTab('vendor_booth')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 tactile-btn ${
                activeTab === 'vendor_booth'
                  ? 'bg-zinc-950 text-white shadow-2xs'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-950'
              }`}
            >
              <Store className="w-4 h-4" />
              Booth Vendor ({boothList.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${activeTab === 'gate_staff' ? 'petugas gate' : 'booth vendor'}...`}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white transition font-medium"
            />
          </div>
        </div>

        {/* Tab 1: Gate Staff Table */}
        {activeTab === 'gate_staff' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="pb-3 pr-4">Nama Petugas</th>
                  <th className="pb-3 pr-4">Gate Assignment</th>
                  <th className="pb-3 pr-4">Device ID</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3 pr-4">Aktivitas Terakhir</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="font-extrabold text-zinc-950 block">{staff.name}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{staff.email}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-semibold text-zinc-800">{staff.assigned_gate}</td>
                    <td className="py-3.5 pr-4 font-mono font-bold text-zinc-500 text-[11px]">
                      {staff.device_id}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                          staff.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                        }`}
                      >
                        {staff.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-zinc-500 font-medium">{staff.last_scan_at}</td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteStaff(staff.id)}
                        className="p-1.5 rounded-lg border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-200 transition-colors tactile-btn"
                        title="Hapus Petugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Vendor Booth Table */}
        {activeTab === 'vendor_booth' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="pb-3 pr-4">Nama Booth / Stand</th>
                  <th className="pb-3 pr-4">Pemilik Vendor</th>
                  <th className="pb-3 pr-4">Kategori</th>
                  <th className="pb-3 pr-4">NFC Reader ID</th>
                  <th className="pb-3 pr-4">Total Omset Sales</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredBooths.map((booth) => (
                  <tr key={booth.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 pr-4">
                      <span className="font-extrabold text-zinc-950 block">{booth.booth_name}</span>
                      <span className="text-[10px] text-zinc-400 font-mono uppercase">{booth.id}</span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="font-semibold text-zinc-800 block">{booth.owner_name}</span>
                      <span className="text-[11px] text-zinc-400 font-mono">{booth.owner_email}</span>
                    </td>
                    <td className="py-3.5 pr-4 font-medium text-zinc-600">{booth.category}</td>
                    <td className="py-3.5 pr-4 font-mono font-bold text-zinc-500 text-[11px]">
                      {booth.nfc_reader_id}
                    </td>
                    <td className="py-3.5 pr-4 font-black text-emerald-800 font-mono">
                      Rp {booth.total_sales.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteBooth(booth.id)}
                        className="p-1.5 rounded-lg border border-zinc-200 text-zinc-400 hover:text-red-600 hover:border-red-200 transition-colors tactile-btn"
                        title="Hapus Booth"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add Staff / Booth */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-zinc-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-zinc-950 flex items-center gap-2">
              <Plus className="w-5 h-5 text-zinc-900" />
              {activeTab === 'gate_staff' ? 'Tambah Petugas Gate Baru' : 'Registrasi Booth Vendor Baru'}
            </h2>

            {activeTab === 'gate_staff' ? (
              <form onSubmit={handleAddStaff} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    placeholder="Rudi Gate Staff"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Email Akun Staff *</label>
                  <input
                    type="email"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                    placeholder="gate@soundwave.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Penugasan Titik Gate</label>
                  <select
                    value={staffForm.gate}
                    onChange={(e) => setStaffForm({ ...staffForm, gate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                  >
                    <option>Gate A (Main Entrance North)</option>
                    <option>Gate B (VIP Fast Track)</option>
                    <option>Gate C (South Exit &amp; Entry)</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 tactile-btn"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 shadow-xs tactile-btn"
                  >
                    Simpan Petugas
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddBooth} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama Stand / Booth *</label>
                  <input
                    type="text"
                    value={boothForm.name}
                    onChange={(e) => setBoothForm({ ...boothForm, name: e.target.value })}
                    placeholder="Kopi Kenangan Festival"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Nama Pemilik Vendor</label>
                  <input
                    type="text"
                    value={boothForm.owner}
                    onChange={(e) => setBoothForm({ ...boothForm, owner: e.target.value })}
                    placeholder="Andi Wijaya"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Email Kontak Vendor *</label>
                  <input
                    type="email"
                    value={boothForm.email}
                    onChange={(e) => setBoothForm({ ...boothForm, email: e.target.value })}
                    placeholder="vendor@soundwave.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">Kategori Produk</label>
                  <select
                    value={boothForm.category}
                    onChange={(e) => setBoothForm({ ...boothForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:bg-white"
                  >
                    <option>Beverage &amp; Drinks</option>
                    <option>Food &amp; Snacks</option>
                    <option>Official Merchandise</option>
                    <option>Sponsor Exhibition</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 tactile-btn"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 shadow-xs tactile-btn"
                  >
                    Daftarkan Booth
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
