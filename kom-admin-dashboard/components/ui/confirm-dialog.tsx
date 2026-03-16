"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@headlessui/react";
import { Loader } from "./loader";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <Dialog.Title className="text-lg font-bold">{title}</Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-gray-500">
            {message}
          </Dialog.Description>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? <Loader className="h-4 w-4" /> : confirmLabel}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
