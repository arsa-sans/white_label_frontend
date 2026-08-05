'use client';

import React from 'react';
import { AlertTriangle, Info, CheckCircle2, XCircle, Loader2, ShieldAlert, LucideIcon } from 'lucide-react';

export interface ConfirmDetailItem {
  label: string;
  value: string;
}

export interface ConfirmModalProps {
  isOpen: boolean;
  segmentTag?: string;
  title: string;
  message: string;
  details?: ConfirmDetailItem[];
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  loading?: boolean;
  customIcon?: LucideIcon;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  segmentTag,
  title,
  message,
  details,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'warning',
  loading = false,
  customIcon,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: customIcon || XCircle,
          tagBg: 'bg-red-100 text-red-700 border-red-200',
          iconBg: 'bg-red-50 text-red-600 border-red-200 shadow-sm shadow-red-100',
          buttonBg: 'bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 active:scale-[0.98]',
          border: 'border-red-200',
        };
      case 'warning':
        return {
          icon: customIcon || AlertTriangle,
          tagBg: 'bg-amber-100 text-amber-800 border-amber-200',
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200 shadow-sm shadow-amber-100',
          buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 active:scale-[0.98]',
          border: 'border-amber-200',
        };
      case 'success':
        return {
          icon: customIcon || CheckCircle2,
          tagBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200 shadow-sm shadow-emerald-100',
          buttonBg: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-[0.98]',
          border: 'border-emerald-200',
        };
      case 'info':
      default:
        return {
          icon: customIcon || Info,
          tagBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          iconBg: 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm shadow-indigo-100',
          buttonBg: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 active:scale-[0.98]',
          border: 'border-indigo-200',
        };
    }
  };

  const config = getVariantStyles();
  const IconComponent = config.icon;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-md flex items-center justify-center p-4 transition-all duration-200 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 space-y-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
        {/* Segment Tag Badge */}
        {segmentTag && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${config.tagBg}`}>
              <ShieldAlert className="w-3 h-3 stroke-[2.5]" />
              Segment: {segmentTag}
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Verifikasi Diperlukan</span>
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className={`p-3.5 rounded-2xl border ${config.iconBg} flex-shrink-0`}>
            <IconComponent className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{title}</h3>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">{message}</p>
          </div>
        </div>

        {/* Structured Details Summary List */}
        {details && details.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2 text-xs">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Rincian Konfirmasi Segment:
            </span>
            <div className="space-y-1.5 divide-y divide-slate-200/40">
              {details.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between pt-1.5 first:pt-0">
                  <span className="text-slate-500 font-medium">{item.label}</span>
                  <span className="font-bold text-slate-900 font-mono">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all disabled:opacity-50 ${config.buttonBg}`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
