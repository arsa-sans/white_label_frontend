'use client';

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Clock, Ticket, ShieldCheck } from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/lib/store';

export default function QueuePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const router = useRouter();
  const { user, setActiveEventId, setQueueSession } = useAppStore();

  const [rank, setRank] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [estimatedWait, setEstimatedWait] = useState<number>(0);
  const [admitted, setAdmitted] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [joining, setJoining] = useState(true);
  const [countdown, setCountdown] = useState<number>(0);
  const [eventName, setEventName] = useState<string>('');
  const [eventBanner, setEventBanner] = useState<string>('');
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      router.push('/register');
    }
  }, [user]);

  // Fetch event info
  useEffect(() => {
    api.get(`/events/${eventId}`).then((res) => {
      if (res.data.success) {
        setEventName(res.data.data.name);
        setEventBanner(res.data.data.banner_url);
      }
    }).catch(() => {});
  }, [eventId]);

  // Join queue on mount
  useEffect(() => {
    if (!user) return;
    setActiveEventId(eventId);
    joinQueue();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [eventId, user]);

  const joinQueue = async () => {
    setJoining(true);
    try {
      const res = await api.post('/queue/join', { event_id: eventId });
      if (res.data.success) {
        const data = res.data.data;
        setSessionId(data.session_id);
        setRank(data.rank);
        setEstimatedWait(data.estimated_wait_seconds || 5);

        if (data.admitted) {
          handleAdmitted(data);
        } else {
          setCountdown(data.estimated_wait_seconds || 5);
          startPolling(data.session_id);
          startCountdown(data.estimated_wait_seconds || 5);
        }
      }
    } catch (err: any) {
      console.error('Failed to join queue', err);
    } finally {
      setJoining(false);
    }
  };

  const startPolling = (sid: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/queue/status', {
          params: { event_id: eventId, session_id: sid },
        });
        if (res.data.success) {
          const data = res.data.data;
          setRank(data.rank);
          setTotal(data.total);

          if (data.admitted) {
            handleAdmitted(data);
          }
        }
      } catch {
        // silent
      }
    }, 2000);
  };

  const startCountdown = (seconds: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    let remaining = seconds;
    countdownRef.current = setInterval(() => {
      remaining--;
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    }, 1000);
  };

  const handleAdmitted = (data: any) => {
    setAdmitted(true);
    if (pollRef.current) clearInterval(pollRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    // Calculate checkout expiry
    const ttl = data.checkout_ttl_seconds || 60;
    const expiresAt = data.checkout_expires_at || new Date(Date.now() + ttl * 1000).toISOString();

    setQueueSession(data.session_id, expiresAt);

    // Short delay then redirect to checkout
    setTimeout(() => {
      router.push(`/checkout?event_id=${eventId}`);
    }, 1500);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md text-center space-y-8">
        {/* Event Context */}
        {eventBanner && (
          <div className="relative w-24 h-24 mx-auto rounded-2xl overflow-hidden shadow-lg border-2 border-white">
            <img src={eventBanner} alt={eventName} className="w-full h-full object-cover" />
          </div>
        )}
        {eventName && (
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{eventName}</p>
        )}

        {/* Queue Animation */}
        <div className="relative">
          {/* Animated Rings */}
          <div className="relative w-32 h-32 mx-auto">
            <div className={`absolute inset-0 rounded-full border-4 ${
              admitted ? 'border-emerald-400' : 'border-indigo-200'
            } animate-ping opacity-20`} />
            <div className={`absolute inset-2 rounded-full border-4 ${
              admitted ? 'border-emerald-300' : 'border-indigo-300'
            } animate-pulse opacity-40`} />
            <div className={`absolute inset-4 rounded-full ${
              admitted ? 'bg-emerald-100' : 'bg-indigo-100'
            } flex items-center justify-center`}>
              {admitted ? (
                <ShieldCheck className="w-12 h-12 text-emerald-600" />
              ) : (
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              )}
            </div>
          </div>
        </div>

        {/* Status Text */}
        {admitted ? (
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-emerald-700">Anda Telah Masuk!</h2>
            <p className="text-sm text-slate-600">
              Mengalihkan ke halaman checkout...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-900">Dalam Antrian</h2>
            <p className="text-sm text-slate-500">
              Harap tunggu, Anda akan dialihkan ke halaman checkout secara otomatis.
            </p>
          </div>
        )}

        {/* Queue Stats */}
        {!admitted && (
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Users className="w-4 h-4 text-indigo-500" />
              </div>
              <span className="block text-2xl font-black text-indigo-600">
                #{rank}
              </span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Posisi</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <span className="block text-2xl font-black text-amber-600">
                {countdown > 0 ? `${countdown}s` : '...'}
              </span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Est. Waktu</span>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Ticket className="w-4 h-4 text-cyan-500" />
              </div>
              <span className="block text-2xl font-black text-cyan-600">
                {total || '-'}
              </span>
              <span className="block text-[10px] font-bold text-slate-400 uppercase">Dalam Antrian</span>
            </div>
          </div>
        )}

        {/* Info Note */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 text-xs text-slate-500 font-medium">
          <ShieldCheck className="w-4 h-4 text-indigo-500 inline mr-1.5" />
          Sistem antrian menjamin keadilan akses. Jangan meninggalkan halaman ini.
        </div>
      </div>
    </div>
  );
}
