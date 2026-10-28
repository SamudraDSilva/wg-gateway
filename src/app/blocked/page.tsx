"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function BlockedContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  let title = "Direct Access Prohibited (403)";
  let description =
    "This onboarding gateway endpoint cannot be accessed directly from a browser address bar.";

  if (reason === "callback_direct_access") {
    title = "OAuth Callback Direct Access Blocked (403)";
    description =
      "The callback endpoint requires an active, verified Meta OAuth transaction. Directly navigating to this URL is prohibited.";
  } else if (reason === "onboard_direct_access") {
    title = "Missing Onboarding Entry Point (403)";
    description =
      "Onboarding must be initiated from an authorized partner platform with an authenticated workspace context.";
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 select-none font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-2xl p-8 shadow-2xl relative text-center">
        {/* Ambient red glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4 mx-auto">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">{title}</h1>
        <p className="text-xs font-mono text-rose-400 mt-1 uppercase tracking-wider">
          Security Policy Enforcement
        </p>

        <div className="mt-5 p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-left text-xs text-slate-300 space-y-2">
          <p>{description}</p>
          <p className="text-[11px] text-slate-400">
            For security and privacy, headless onboarding URLs are locked to authorized client handshakes only.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => window.close()}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BlockedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Access Denied
        </div>
      }
    >
      <BlockedContent />
    </Suspense>
  );
}
