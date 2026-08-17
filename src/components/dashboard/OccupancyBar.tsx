'use client';

import React from 'react';

interface OccupancyBarProps {
  label: string;
  percent: number;
  color: string;
}

export default function OccupancyBar({ label, percent, color }: OccupancyBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-bold text-slate-700">{label}</span>
        <span className="font-extrabold text-slate-900">{percent}%</span>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
