'use client';

import { useConfirmContext, ShowConfirmOptions } from '@/context/ConfirmContext';

export function useConfirm() {
  const { confirm } = useConfirmContext();
  return confirm;
}

export type { ShowConfirmOptions };
