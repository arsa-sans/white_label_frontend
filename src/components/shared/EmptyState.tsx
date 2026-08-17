'use client';

import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon: Icon = HelpCircle,
  title,
  description,
  action,
  className = 'py-16',
}: EmptyStateProps) {
  return (
    <div className={`text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-3 ${className}`}>
      <Icon className="w-10 h-10 text-slate-300 mx-auto" />
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && <p className="text-xs text-slate-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
