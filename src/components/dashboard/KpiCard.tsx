'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export default function KpiCard({ icon: Icon, label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-3 shadow-xs hover:border-zinc-300 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
        <div className="p-2 rounded-xl bg-zinc-100 border border-zinc-200 text-zinc-900">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-black text-zinc-950 font-mono tabular-nums tracking-tight">{value}</div>
      {sub && <div className="text-xs text-zinc-400 font-medium">{sub}</div>}
    </div>
  );
}
