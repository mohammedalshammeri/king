"use client";

import type React from "react";
import { cn } from "../../lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className={cn("w-full max-w-lg rounded-xl bg-white p-5 shadow-xl")}> 
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-black/60 hover:text-black">
            إغلاق
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
