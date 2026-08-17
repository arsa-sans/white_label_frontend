'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
  color: string;
}

export default function KpiCard({ icon: Icon, label, value, sub, color }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</span>
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-black text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-400 font-medium">{sub}</div>}
    </div>
  );
}
