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
      <div className="relative flex min-h-screen flex-col items-center justify-start px-4 pt-[56vh] sm:pt-[50vh]">
        <div className="w-full max-w-sm">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <ShoppingBag className="h-12 w-12 text-[#0b0f1a]" strokeWidth={2} />
          </div>

          <div className="mt-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.03em] text-white">MarketConnect</h1>
            <p className="mt-3 text-sm text-slate-400">Buy, sell, and connect locally.</p>
          </div>

          <div className="mt-14 flex flex-col items-center gap-4">
            <button
              type="button"
              onClick={onSignIn}
              className="w-[92vw] max-w-sm rounded-full bg-white px-6 py-4 text-lg font-semibold text-[#0b0f1a] shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={onCreateAccount}
              className="w-[92vw] max-w-sm rounded-full border border-slate-700 bg-transparent px-6 py-4 text-lg font-semibold text-white transition hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent"
            >
              Create an Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
