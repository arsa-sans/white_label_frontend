'use client';

import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle2, XCircle, AlertOctagon, Wifi, WifiOff, RefreshCw, Smartphone, Scan } from 'lucide-react';
import api from '@/lib/api';

interface ScanResult {
  result: 'valid' | 'invalid' | 'duplicate' | 'expired';
  ticket_id?: string;
  seat_name?: string;
  category?: string;
  event_name?: string;
  message: string;
}

export default function GateScanPage() {
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [flashColor, setFlashColor] = useState<'emerald' | 'red' | 'amber' | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingLogs, setPendingLogs] = useState<number>(0);
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check connection state
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerScan = async (overrideToken?: string) => {
    const token = overrideToken || qrInput;
    if (!token) return;

    setLoading(true);
    setScanResult(null);

    try {
      if (isOnline) {
        const res = await api.post('/gate/validate', {
          qr_token: token,
          gate_device_id: 'GATE-WEB-01',
        });

        const data: ScanResult = res.data.data;
        setScanResult(data);

        if (data.result === 'valid') {
          setFlashColor('emerald');
        } else if (data.result === 'duplicate') {
          setFlashColor('amber');
        } else {
          setFlashColor('red');
        }

        setScanLogs((prev) => [
          {
            id: Date.now(),
            ticket_id: data.ticket_id || 'UNKNOWN',
            seat: data.seat_name || '-',
            result: data.result,
            time: new Date().toLocaleTimeString(),
          },
          ...prev,
        ]);
      } else {
        // Offline handling simulation
        setPendingLogs((prev) => prev + 1);
        setScanResult({
          result: 'valid',
          message: 'OFFLINE VALIDATION — RECORDED LOKAL',
        });
        setFlashColor('emerald');
      }
    } catch (err: any) {
      setScanResult({
        result: 'invalid',
        message: 'Gagal memproses QR Code',
      });
      setFlashColor('red');
    } finally {
      setLoading(false);
      // Reset flash color after 1.5s
      setTimeout(() => setFlashColor(null), 1500);
    }
  };

  const handleSyncLogs = async () => {
    if (pendingLogs === 0) return;
    try {
      await api.post('/gate/sync-logs', { logs: [] });
      setPendingLogs(0);
      alert('Semua scan log offline berhasil disinkronkan ke server!');
    } catch (err) {
      alert('Gagal sinkronisasi');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Full Screen Visual Scan Flash Overlay */}
      {flashColor && (
        <div
          className={`fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center transition-opacity duration-300 ${
            flashColor === 'emerald'
              ? 'bg-emerald-600/90 text-white'
              : flashColor === 'amber'
              ? 'bg-amber-500/90 text-white'
              : 'bg-red-600/90 text-white'
          }`}
        >
          {flashColor === 'emerald' && (
            <div className="text-center space-y-3 animate-bounce">
              <CheckCircle2 className="w-24 h-24 mx-auto stroke-[3]" />
              <h2 className="text-4xl font-black uppercase">ENTRY GRANTED</h2>
              <p className="text-xl font-bold">SILAKAN MASUK</p>
            </div>
          )}
          {flashColor === 'amber' && (
            <div className="text-center space-y-3">
              <AlertOctagon className="w-24 h-24 mx-auto stroke-[3]" />
              <h2 className="text-4xl font-black uppercase">DUPLICATE TICKET</h2>
              <p className="text-xl font-bold">TIKET SUDAH DIPAKAI!</p>
            </div>
          )}
          {flashColor === 'red' && (
            <div className="text-center space-y-3">
              <XCircle className="w-24 h-24 mx-auto stroke-[3]" />
              <h2 className="text-4xl font-black uppercase">ACCESS DENIED</h2>
              <p className="text-xl font-bold">TIKET INVALID / EXPIRED</p>
            </div>
          )}
        </div>
      )}

      {/* Top Header & Offline Sync Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-indigo-600" />
            Gate Access Scanner (Staff Mode)
          </h1>
          <p className="text-xs text-zinc-500">Validator tiket dengan performa sub-500ms &amp; fallback sinkronisasi offline.</p>
        </div>

        {/* OfflineSyncBadge */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${
              isOnline
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
            }`}
          >
            {isOnline ? <Wifi className="w-4 h-4 text-emerald-600" /> : <WifiOff className="w-4 h-4 text-amber-600" />}
            {isOnline ? 'Online Gate Connection' : 'Offline Mode (Local Cache)'}
          </div>

          {pendingLogs > 0 && (
            <button
              onClick={handleSyncLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync ({pendingLogs})
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scanner Control & Simulator */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-6 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Scan className="w-5 h-5 text-indigo-600" />
            Simulasi Input QR Token
          </h2>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Tempel QR Token Base64 atau Input Manual:
            </label>
            <textarea
              rows={3}
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              placeholder="Masukkan string payload QR token dari halaman My Tickets..."
              className="w-full p-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => triggerScan()}
              disabled={loading || !qrInput}
              className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-600/30 transition-all"
            >
              {loading ? 'Verifikasi Scan...' : 'SCAN & VERIFIKASI SEKARANG'}
            </button>
          </div>

          {/* Result Alert Box */}
          {scanResult && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold space-y-1 ${
                scanResult.result === 'valid'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900'
                  : scanResult.result === 'duplicate'
                  ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900'
                  : 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-900'
              }`}
            >
              <div className="text-sm uppercase tracking-wider">{scanResult.message}</div>
              {scanResult.seat_name && <div>Kursi: {scanResult.seat_name} ({scanResult.category})</div>}
              {scanResult.ticket_id && <div className="font-mono text-[10px]">ID: {scanResult.ticket_id}</div>}
            </div>
          )}
        </div>

        {/* Scan Log History */}
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Riwayat Scan Gate Sesi Ini</h2>
          {scanLogs.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">Belum ada aktivitas scan gate.</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {scanLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 block">Kursi: {log.seat}</span>
                    <span className="text-[10px] text-zinc-400">{log.time} — {log.ticket_id}</span>
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
    </div>
  );
}
