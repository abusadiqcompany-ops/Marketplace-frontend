import React from 'react';
import { ShoppingBag } from 'lucide-react';

type LandingPageProps = {
  onSignIn: () => void;
  onCreateAccount: () => void;
};

export function LandingPage({ onSignIn, onCreateAccount }: LandingPageProps) {
  return (
    <div className="min-h-screen h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#0b0f1a_0%,_#0b0f1a_36%,_black_100%)]" />
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-sm rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-3xl shadow-[0_40px_90px_rgba(0,0,0,0.45)] sm:shadow-[0_48px_100px_rgba(0,0,0,0.5)] text-center mx-auto">
          <div className="relative mx-auto mb-2 h-24 w-24">
            <span className="absolute inset-0 rounded-[28px] bg-[radial-gradient(circle,_rgba(56,189,248,0.24),_rgba(11,15,26,0.08),_transparent_70%)] blur-xl" />
            <div className="relative flex h-full w-full items-center justify-center rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)] transition-transform duration-700 ease-in-out" style={{ animation: 'float 6s ease-in-out infinite' }}>
              <ShoppingBag className="h-12 w-12 text-[#0b0f1a]" strokeWidth={2} />
            </div>
          </div>

          <div className="mt-8 px-6 py-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-white">MarketConnect</h1>
            <p className="mt-3 text-sm text-slate-400">Buy, sell, and connect locally.</p>
          </div>

          <div className="mt-14 flex flex-col items-center gap-4 px-6 pb-10">
            <button
              type="button"
              onClick={onSignIn}
              className="w-full rounded-full bg-white px-6 py-4 text-lg font-semibold text-[#0b0f1a] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onCreateAccount}
              className="w-full rounded-full border border-slate-700 bg-transparent px-6 py-4 text-lg font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
