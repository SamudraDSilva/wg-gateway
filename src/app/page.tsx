export default function GatewayHome() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative text-center">
        {/* Glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-4 mx-auto">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-white tracking-tight">Waba Guru Gateway</h1>
        <p className="text-xs font-mono text-amber-400/90 mt-1 uppercase tracking-wider">
          Direct Access Restricted (403)
        </p>

        <div className="mt-5 p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-left text-xs text-slate-300 space-y-2">
          <p>
            This hosted onboarding gateway provides headless Meta Embedded Signup integration for authorized partner platforms.
          </p>
          <p className="text-[11px] text-slate-400">
            Directly typing this URL into a browser is restricted. Please initiate WhatsApp onboarding from your designated partner application dashboard.
          </p>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500">
          Waba Guru Multi-Tenant Gateway &bull; Stateless Runtime
        </div>
      </div>
    </div>
  );
}
