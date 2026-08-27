import React from 'react';
import { Eye, EyeOff, ShoppingBag } from 'lucide-react';
import type { Role } from '../types';

type LoginFormState = {
  email: string;
  password: string;
};

type RegisterFormState = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
};

type AuthPageProps = {
  authMode: 'login' | 'register';
  loginForm: LoginFormState;
  registerForm: RegisterFormState;
  showRegisterPassword: boolean;
  authLoading: boolean;
  authError: string | null;
  authSuccess: string | null;
  passwordError: string | null;
  pendingSignupEmail: string;
  emailOtp: string;
  onResendEmailOtp: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onLoginFieldChange: (field: keyof LoginFormState, value: string) => void;
  onRegisterFieldChange: (field: keyof RegisterFormState, value: string) => void;
  onEmailOtpChange: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onSwitchMode: (mode: 'login' | 'register') => void;
  onCancel: () => void;
};

export function AuthPage({
  authMode,
  loginForm,
  registerForm,
  showRegisterPassword,
  authLoading,
  authError,
  authSuccess,
  passwordError,
  pendingSignupEmail,
  emailOtp,
  onResendEmailOtp,
  onSubmit,
  onLoginFieldChange,
  onRegisterFieldChange,
  onEmailOtpChange,
  onTogglePasswordVisibility,
  onSwitchMode,
  onCancel,
}: AuthPageProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-zinc-950 px-3 py-6 text-white sm:px-4 sm:py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-6 text-center sm:mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/95 text-slate-950 mx-auto mb-4 shadow-lg shadow-emerald-900/20">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">MarketConnect</h1>
        </div>

        <div className="rounded-[32px] bg-white p-5 text-slate-950 shadow-2xl sm:p-8">
          <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{authMode === 'login' ? 'Welcome Back' : 'Join MarketConnect'}</h2>
              <p className="mt-2 text-sm text-slate-500">{authMode === 'login' ? 'Enter your credentials to continue' : 'Create a new account to start selling and buying'}</p>
            </div>
            <button
              type="button"
              onClick={() => onSwitchMode(authMode === 'login' ? 'register' : 'login')}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-500 hover:text-emerald-600"
            >
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
            {pendingSignupEmail ? (
              <div className="space-y-5">
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                  <h3 className="text-xl font-semibold text-slate-950">Verify your email</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Enter the 6-digit code sent to <strong>{pendingSignupEmail}</strong> before continuing.
                  </p>
                </div>
                <label htmlFor="signup-email-otp" className="sr-only">Email verification code</label>
                <input
                  id="signup-email-otp"
                  name="emailOtp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="Enter 6-digit code"
                  value={emailOtp}
                  onChange={(event) => onEmailOtpChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-center text-xl font-semibold tracking-[0.35em] text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <button
                  type="submit"
                  disabled={authLoading || emailOtp.length !== 6}
                  className="w-full rounded-3xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {authLoading ? 'Verifying code…' : 'Verify Email and Continue'}
                </button>
                <button
                  type="button"
                  onClick={onResendEmailOtp}
                  disabled={authLoading}
                  className="w-full text-sm font-semibold text-emerald-700 transition hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Resend code
                </button>
              </div>
            ) : authMode === 'login' ? (
              <>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email"
                  value={loginForm.email}
                  onChange={(event) => onLoginFieldChange('email', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(event) => onLoginFieldChange('password', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-3xl bg-slate-950 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading ? 'Signing in…' : 'Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <input
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Full Name"
                  value={registerForm.name}
                  onChange={(event) => onRegisterFieldChange('name', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <input
                  id="register-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="Email Address"
                  value={registerForm.email}
                  onChange={(event) => onRegisterFieldChange('email', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                <div className="relative">
                  <input
                    id="register-password"
                    name="password"
                    type={showRegisterPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={(event) => onRegisterFieldChange('password', event.target.value)}
                    className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 pr-12 text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                  />
                  <button
                    type="button"
                    onClick={onTogglePasswordVisibility}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
                  >
                    {showRegisterPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={showRegisterPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm Password"
                  value={registerForm.confirmPassword}
                  onChange={(event) => onRegisterFieldChange('confirmPassword', event.target.value)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                />
                {passwordError && (
                  <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                    {passwordError}
                  </div>
                )}
                <select
                  id="register-role"
                  name="role"
                  value={registerForm.role}
                  onChange={(event) => onRegisterFieldChange('role', event.target.value as Role)}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-100 px-5 py-4 text-slate-950 outline-none focus:border-emerald-500 focus:ring-emerald-500/20"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>
                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-3xl bg-emerald-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {authLoading ? 'Creating account…' : 'Create Account'}
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="w-full rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
