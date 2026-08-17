'use client';

import React from 'react';
import { Calendar, MapPin, Layers, Eye, EyeOff, Pencil, Trash2, ImageIcon } from 'lucide-react';
import { EventItem } from './EventFormModal';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    draft: 'bg-amber-100 text-amber-800 border-amber-200',
    ended: 'bg-slate-100 text-slate-600 border-slate-200',
    deleted: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${map[status] || map.draft}`}>
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
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
  onToggleStatus,
  onManageTiers,
}: EventCardProps) {
  const isPublished = event.status === 'published';
  const dateStr = new Date(event.start_date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden group">
      {/* Banner */}
      <div className="relative h-36 overflow-hidden bg-slate-100">
        {event.banner_url ? (
          <img
            src={event.banner_url}
            alt={event.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
            <ImageIcon className="w-8 h-8 text-slate-400" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <StatusBadge status={event.status} />
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2 left-3">
          <span className="text-[10px] font-bold text-white/90 bg-black/30 px-2 py-0.5 rounded-full">
            {event.category}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1">{event.name}</h3>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <Calendar className="w-3 h-3 shrink-0" /> {dateStr}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
            <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{event.location}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 rounded-xl p-2 border border-slate-100">
            <div className="text-xs font-black text-slate-900">{event.stats.total_seats}</div>
            <div className="text-[9px] font-bold uppercase text-slate-400">Kuota</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-2 border border-emerald-100">
            <div className="text-xs font-black text-emerald-800">{event.stats.sold_seats}</div>
            <div className="text-[9px] font-bold uppercase text-emerald-600">Terjual</div>
          </div>
          <div className="bg-indigo-50 rounded-xl p-2 border border-indigo-100">
            <div className="text-xs font-black text-indigo-800">{event.stats.sold_percent}%</div>
            <div className="text-[9px] font-bold uppercase text-indigo-600">Terisi</div>
          </div>
        </div>

        {/* Occupancy bar */}
        <div className="space-y-1">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
              style={{ width: `${event.stats.sold_percent}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 font-medium">
            Rp {event.price_min.toLocaleString('id-ID')} – Rp {event.price_max.toLocaleString('id-ID')}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onManageTiers}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 text-xs font-bold hover:bg-violet-100 transition-colors flex-1 justify-center"
          >
            <Layers className="w-3.5 h-3.5" /> Tier Tiket
          </button>
          <button
            onClick={onToggleStatus}
            title={isPublished ? 'Unpublish' : 'Publish'}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
              isPublished
                ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            {isPublished ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
