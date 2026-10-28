"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

interface MetaConfig {
  app_id: string;
  config_id?: string;
  version?: string;
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const rawWorkspace = searchParams.get("workspace_id")?.trim();
  const sessionId = searchParams.get("session_id")?.trim() || undefined;
  const returnUrl = searchParams.get("return_url")?.trim() || undefined;
  const appName = searchParams.get("app_name")?.trim() || "Partner Platform";

  const [isClient, setIsClient] = useState(false);
  const [hasOpener, setHasOpener] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setHasOpener(Boolean(window.opener));
  }, []);

  // Entry Point Validation:
  // Must have an explicit workspace_id or session_id, AND must have an opener or return_url.
  // Direct typing of "/onboard" without context is strictly blocked.
  const isDirectAccess =
    isClient &&
    !sessionId &&
    (!rawWorkspace || (!hasOpener && !returnUrl));

  const workspaceId = rawWorkspace || "default";

  const [metaConfig, setMetaConfig] = useState<MetaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Fetch Meta configuration dynamically from backend only if entry point is valid
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setErrorDetails(null);

      const res = await fetch("/api/meta-config", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error || `Failed to load Meta configuration (HTTP ${res.status})`;
        setError(msg);
        if (data.details) {
          setErrorDetails(typeof data.details === "string" ? data.details : JSON.stringify(data.details));
        }
        return;
      }

      if (!data.app_id || !data.config_id) {
        setError("Incomplete Meta configuration received from backend");
        setErrorDetails("Both 'app_id' and 'config_id' are required to start Embedded Signup.");
        return;
      }

      setMetaConfig(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error loading Meta configuration";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isDirectAccess) {
      void fetchConfig();
    }
  }, [fetchConfig, isDirectAccess]);

  // In-place direct navigation to Meta OAuth Dialog (NO SECOND POPUP!)
  const handleLaunchInPlace = () => {
    if (!metaConfig?.app_id || !metaConfig?.config_id) {
      setError("Meta configuration is not ready. Please try again.");
      return;
    }

    setRedirecting(true);

    const redirectUri = `${window.location.origin}/onboard/callback`;
    const stateObj = {
      workspace_id: workspaceId,
      session_id: sessionId,
      return_url: returnUrl,
      app_name: appName,
    };

    const oauthEndpoint = `https://www.facebook.com/${metaConfig.version || "v20.0"}/dialog/oauth`;
    const params = new URLSearchParams({
      client_id: metaConfig.app_id,
      config_id: metaConfig.config_id,
      redirect_uri: redirectUri,
      response_type: "code",
      state: JSON.stringify(stateObj),
    });

    window.location.href = `${oauthEndpoint}?${params.toString()}`;
  };

  // Blocked Direct URL Screen
  if (isDirectAccess) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 select-none">
        <div className="w-full max-w-md bg-slate-900 border border-red-900/60 rounded-2xl p-8 shadow-2xl relative text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4 mx-auto">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-white tracking-tight">Direct Access Prohibited</h1>
          <p className="text-xs font-mono text-red-400 mt-1 uppercase tracking-wider">
            403 &bull; Missing Authorized Entry Point
          </p>

          <div className="mt-5 p-4 bg-slate-950/80 border border-slate-800 rounded-xl text-left text-xs text-slate-300 space-y-2">
            <p>
              This onboarding gateway cannot be opened by typing the URL directly into your browser.
            </p>
            <p className="text-[11px] text-slate-400">
              WhatsApp channel authorization must be initiated from your partner application dashboard with an authenticated workspace context.
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative ambient glows */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 shadow-inner">
            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Connect WhatsApp Business</h1>
          <p className="text-slate-400 text-sm mt-1">
            Authorizing WhatsApp channel for <span className="font-semibold text-slate-200">{appName}</span>
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700">
            Workspace: {workspaceId}
          </div>
        </div>

        {/* Error Notification Card with Retry */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/70 border border-red-800/90 text-red-200 text-xs space-y-2">
            <div className="flex items-start gap-2 font-semibold">
              <span className="text-red-400 text-sm">⚠</span>
              <span>Gateway Error: {error}</span>
            </div>
            {errorDetails && (
              <p className="text-[11px] text-red-300/80 font-mono pl-5 break-all">
                {errorDetails}
              </p>
            )}
            <div className="pt-2 pl-5 flex items-center gap-2">
              <button
                type="button"
                onClick={fetchConfig}
                disabled={loading}
                className="px-3 py-1 bg-red-900/60 hover:bg-red-850 border border-red-700 rounded text-red-100 font-medium cursor-pointer text-[11px] transition"
              >
                {loading ? "Retrying..." : "↻ Retry Connection"}
              </button>
              <button
                type="button"
                onClick={() => window.close()}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 font-medium cursor-pointer text-[11px] transition"
              >
                Close Window
              </button>
            </div>
          </div>
        )}

        {/* Steps Guide */}
        <div className="space-y-6">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">1.</span>
              <span>Log in to your Meta Business Account.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">2.</span>
              <span>Select your WhatsApp Business profile and phone number.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">3.</span>
              <span>Authorize channel access. This window will auto-close.</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleLaunchInPlace}
              disabled={loading || redirecting || !metaConfig || !!error}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-lg shadow-emerald-950/50 cursor-pointer text-sm"
            >
              {redirecting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Redirecting to Facebook...</span>
                </>
              ) : loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Loading Meta Configuration...</span>
                </>
              ) : error ? (
                <span>Setup Unavailable</span>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.28z" />
                  </svg>
                  <span>Continue to WhatsApp Setup</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 text-center">
          <span className="text-[11px] text-slate-500">
            Powered by <strong className="text-slate-400 font-semibold">Waba Guru</strong> Gateway
          </span>
        </div>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Loading Onboarding Gateway...
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}
