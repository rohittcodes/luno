'use client'

import { toast } from 'sonner'

/**
 * Hook to show confirmation dialogs using Sonner
 * Returns a function that shows a toast with action buttons
 */
export function useConfirm() {
  return (message: string, onConfirm: () => void | Promise<void>) => {
    toast(message, {
      action: {
        label: 'Confirm',
        onClick: async () => {
          await onConfirm()
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
      duration: Infinity, // Keep open until user action
    })
  }
}

