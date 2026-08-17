'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export default function LoadingSpinner({
  message = 'Memuat data...',
  className = 'py-20',
}: LoadingSpinnerProps) {
  return (
    <div className={`text-center ${className} space-y-3`}>
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
      <p className="text-xs text-slate-500 font-medium">{message}</p>
    </div>
  );
}
