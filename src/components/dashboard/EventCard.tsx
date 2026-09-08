'use client';

import React from 'react';
import { Calendar, MapPin, Layers, Eye, EyeOff, Pencil, Trash2, ImageIcon, Clock } from 'lucide-react';
import { EventItem } from './EventFormModal';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    draft: 'bg-amber-50 text-amber-800 border-amber-200',
    ended: 'bg-zinc-100 text-zinc-600 border-zinc-200',
    deleted: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${map[status] || map.draft}`}>
      {status}
    </span>
  );
}

interface EventCardProps {
  event: EventItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onManageTiers: () => void;
  onManageSessions?: () => void;
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageTiers,
  onManageSessions,
}: EventCardProps) {
  const isPublished = event.status === 'published';
  const dateStr = new Date(event.start_date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-2xs hover:shadow-xs transition-all overflow-hidden group flex flex-col justify-between">
      {/* Banner */}
      <div>
        <div className="relative h-40 overflow-hidden bg-zinc-100">
          {event.banner_url ? (
            <img
              src={event.banner_url}
              alt={event.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-100">
              <ImageIcon className="w-8 h-8 text-zinc-400" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <StatusBadge status={event.status} />
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-2.5 left-3">
            <span className="text-[10px] font-extrabold text-white bg-black/40 backdrop-blur-xs px-2.5 py-0.5 rounded-md border border-white/20">
              {event.category}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-extrabold text-zinc-950 text-sm leading-tight line-clamp-1">{event.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
              <Calendar className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> {dateStr}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-zinc-500">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" /> <span className="truncate">{event.location}</span>
            </div>
            {event.sale_start_at && (
              <div className="mt-2 text-[10px] font-semibold">
                {(() => {
                  const now = new Date();
                  const start = new Date(event.sale_start_at);
                  const end = event.sale_end_at ? new Date(event.sale_end_at) : null;
                  if (now < start) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" /> Sale Buka: {start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}, {start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    );
                  } else if (end && now > end) {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                        <Clock className="w-3 h-3 text-red-600" /> Sale Ditutup
                      </span>
                    );
                  } else {
                    return (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Clock className="w-3 h-3 text-emerald-600" /> Sale Sedang Buka
                      </span>
                    );
                  }
                })()}
              </div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-zinc-50 rounded-2xl p-2.5 border border-zinc-100">
              <div className="text-xs font-black text-zinc-950 font-mono">{event.stats.total_seats}</div>
              <div className="text-[9px] font-bold uppercase text-zinc-400">Kuota</div>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-100">
              <div className="text-xs font-black text-emerald-800 font-mono">{event.stats.sold_seats}</div>
              <div className="text-[9px] font-bold uppercase text-emerald-600">Terjual</div>
            </div>
            <div className="bg-zinc-100 rounded-2xl p-2.5 border border-zinc-200">
              <div className="text-xs font-black text-zinc-950 font-mono">{event.stats.sold_percent}%</div>
              <div className="text-[9px] font-bold uppercase text-zinc-600">Terisi</div>
            </div>
          </div>

          {/* Occupancy bar */}
          <div className="space-y-1">
            <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200/50">
              <div
                className="h-full rounded-full bg-zinc-950 transition-all duration-700"
                style={{ width: `${event.stats.sold_percent}%` }}
              />
            </div>
            <div className="text-[10px] text-zinc-400 font-mono font-semibold">
              Rp {event.price_min.toLocaleString('id-ID')} – Rp {event.price_max.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 pt-1 border-t border-zinc-100 flex flex-wrap gap-2">
        <button
          onClick={onManageTiers}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-xs font-bold hover:bg-zinc-100 transition-colors flex-1 justify-center tactile-btn"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-600" /> Tier Tiket
        </button>
        {onManageSessions && (
          <button
            onClick={onManageSessions}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 text-xs font-bold hover:bg-zinc-100 transition-colors tactile-btn"
            title="Kelola Sesi & Hari"
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-600" /> Sesi
          </button>
        )}
        <button
          onClick={onToggleStatus}
          title={isPublished ? 'Unpublish' : 'Publish'}
          className={`p-2 rounded-xl border text-xs font-bold transition-colors tactile-btn ${
            isPublished
              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onEdit}
          className="p-2 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-colors tactile-btn"
          title="Edit Event"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors tactile-btn"
          title="Hapus Event"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
