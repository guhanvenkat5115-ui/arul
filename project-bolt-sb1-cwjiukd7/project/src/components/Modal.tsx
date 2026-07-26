import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: ModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-brand-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-white shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between border-b border-brand-100 px-6 py-4 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-semibold text-brand-800">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-brand-500 hover:bg-brand-50 hover:text-brand-700 transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
