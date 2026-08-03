import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { Role } from '../types';

interface LoginFormState {
  email: string;
  password: string;
}

interface RegisterFormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

interface AuthModalProps {
  isOpen: boolean;
  authMode: 'login' | 'register';
  loginForm: LoginFormState;
  registerForm: RegisterFormState;
  showRegisterPassword: boolean;
  authLoading: boolean;
  authError: string | null;
  authSuccess: string | null;
  passwordError: string | null;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onLoginFieldChange: (field: keyof LoginFormState, value: string) => void;
  onRegisterFieldChange: (field: keyof RegisterFormState, value: string) => void;
  onTogglePasswordVisibility: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
}

export function AuthModal({
  isOpen,
  authMode,
  loginForm,
  registerForm,
  showRegisterPassword,
  authLoading,
  authError,
  authSuccess,
  passwordError,
  onClose,
  onSubmit,
  onLoginFieldChange,
  onRegisterFieldChange,
  onTogglePasswordVisibility,
  onSwitchMode,
}: AuthModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-md text-slate-950 p-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="text-3xl font-semibold tracking-tight">{authMode === 'login' ? 'Welcome Back' : 'Join MarketConnect'}</h2>
          <button type="button" onClick={() => onSwitchMode(authMode === 'login' ? 'register' : 'login')} className="text-sm font-medium text-slate-500 hover:text-slate-900">
            {authMode === 'login' ? 'Create account' : 'Sign in'}
          </button>
        </div>

        {authError && (
          <div className="mb-4 rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
            {authError}
          </div>
        )}
        {authSuccess && (
          <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700">
            {authSuccess}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {authMode === 'login' ? (
            <>
              <label htmlFor="login-email" className="sr-only">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(event) => onLoginFieldChange('email', event.target.value)}
                className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl"
              />
              <label htmlFor="login-password" className="sr-only">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(event) => onLoginFieldChange('password', event.target.value)}
                className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl"
              />
              <button type="submit" disabled={authLoading} className="w-full py-4 bg-slate-900 text-white font-medium rounded-3xl disabled:opacity-60 disabled:cursor-not-allowed">
                {authLoading ? 'Signing in…' : 'Sign In'}
              </button>
            </>
          ) : (
            <>
              <label htmlFor="register-name" className="sr-only">Full Name</label>
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Full Name"
                value={registerForm.name}
                onChange={(event) => onRegisterFieldChange('name', event.target.value)}
                className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl"
              />
              <label htmlFor="register-email" className="sr-only">Email Address</label>
              <input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="Email Address"
                value={registerForm.email}
                onChange={(event) => onRegisterFieldChange('email', event.target.value)}
                className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl"
              />
              <div className="relative w-full">
                <label htmlFor="register-password" className="text-sm font-medium text-slate-500 mb-2 inline-block">Password</label>
                <input
                  id="register-password"
                  name="password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter your password"
                  value={registerForm.password}
                  onChange={(event) => onRegisterFieldChange('password', event.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl pr-12 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
                <button type="button" onClick={onTogglePasswordVisibility} className="absolute top-9 right-4 text-slate-500">
                  {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
                <p className="mt-2 text-xs text-slate-500">Password must be at least 6 characters</p>
              </div>
              <div className="w-full">
                <label htmlFor="register-confirm-password" className="text-sm font-medium text-slate-500 mb-2 inline-block">Confirm Password</label>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showRegisterPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={registerForm.confirmPassword}
                  onChange={(event) => onRegisterFieldChange('confirmPassword', event.target.value)}
                  className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
              {passwordError && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                  {passwordError}
                </div>
              )}
              <label htmlFor="register-role" className="sr-only">Account type</label>
              <select
                id="register-role"
                name="role"
                value={registerForm.role}
                onChange={(event) => onRegisterFieldChange('role', event.target.value)}
                className="w-full px-5 py-3.5 bg-slate-100 rounded-2xl"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
              <button type="submit" disabled={authLoading} className="w-full py-4 bg-slate-900 text-white font-medium rounded-3xl disabled:opacity-60 disabled:cursor-not-allowed">
                {authLoading ? 'Creating account…' : 'Create Account'}
              </button>
            </>
          )}
        </form>

        <button type="button" onClick={onClose} className="mt-4 w-full text-sm text-slate-500">Cancel</button>
      </div>
    </div>
  );
}
