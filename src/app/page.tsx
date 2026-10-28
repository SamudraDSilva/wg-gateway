"use client";

import { useState } from "react";

export default function GatewayHome() {
  const [workspace, setWorkspace] = useState("default");

  const openPopup = () => {
    const returnUrl = encodeURIComponent(window.location.origin);
    const url = `/onboard?workspace_id=${encodeURIComponent(workspace)}&return_url=${returnUrl}`;
    window.open(url, "wa_onboard", "width=520,height=740,menubar=no,toolbar=no,status=no");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-lg">
            W
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Waba Guru Gateway</h1>
            <p className="text-xs text-slate-400 font-mono">Hosted WhatsApp Onboarding Service</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Target Partner Workspace:
            </label>
            <input
              type="text"
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="e.g. default, acme_corp, dialog"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={openPopup}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 text-sm"
            >
              <span>🌐</span>
              <span>Launch Onboarding Gateway Popup</span>
            </button>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Partner Integration URL Pattern:</p>
            <code className="block font-mono text-emerald-400 break-all">
              /onboard?workspace_id=...&amp;return_url=...
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
