'use client';

import React from 'react';

interface OccupancyBarProps {
  label: string;
  percent: number;
  color?: string;
}

export default function OccupancyBar({ label, percent }: OccupancyBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-zinc-700">{label}</span>
        <span className="font-black text-zinc-950 font-mono tabular-nums">{percent}%</span>
      </div>
      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
        <div
          className="h-full rounded-full transition-all duration-700 bg-zinc-900"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}
