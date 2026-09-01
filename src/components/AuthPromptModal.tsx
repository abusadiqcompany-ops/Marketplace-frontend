import React from 'react';
import { X } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  title?: string;
  message?: string;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  title = 'Create a Free Account',
  message = 'Sign in or create a free MarketConnect account to continue.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-lg">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-slate-100"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>

        <h2 className="mb-3 text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="mb-6 text-slate-600">{message}</p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={onLogin}
            className="flex-1 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-base font-semibold text-slate-700 hover:bg-slate-50"
          >
            Login
          </button>
          <button
            onClick={onRegister}
            className="flex-1 rounded-3xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
};
