"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CallbackContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const rawState = searchParams.get("state") || "default";
  const error = searchParams.get("error_description") || searchParams.get("error");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Securing WhatsApp connection...");
  const [phoneInfo, setPhoneInfo] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setStatus("error");
      setMessage(`Authorization failed: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from Meta.");
      return;
    }

    let workspaceId = "default";
    let returnUrl: string | undefined;

    try {
      const parsed = JSON.parse(rawState);
      workspaceId = parsed.workspace_id || "default";
      returnUrl = parsed.return_url;
    } catch {
      workspaceId = rawState;
    }

    async function handleExchange() {
      try {
        setMessage("Exchanging token with backend...");
        const res = await fetch("/api/connections/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            workspace_id: workspaceId,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setMessage(data.error || "Failed to register connection.");
          return;
        }

        setStatus("success");
        const phone = data.connection?.display_phone_number || data.connection?.phone_number_id || "WhatsApp Account";
        setPhoneInfo(phone);
        setMessage(`Connected ${phone} successfully!`);

        // If opened as a popup window, post message to the parent opener
        if (window.opener) {
          try {
            window.opener.postMessage(
              {
                type: "WA_ONBOARDING_SUCCESS",
                workspace_id: workspaceId,
                connection: data.connection,
              },
              "*",
            );
          } catch (e) {
            console.warn("Could not postMessage to opener:", e);
          }

          // Auto-close popup after 1.5 seconds
          setTimeout(() => {
            window.close();
          }, 1500);
        } else if (returnUrl) {
          // If in full-page redirect flow, redirect to partner's return_url
          setTimeout(() => {
            try {
              const dest = new URL(returnUrl);
              dest.searchParams.set("status", "success");
              if (data.connection?.id) dest.searchParams.set("connection_id", String(data.connection.id));
              window.location.href = dest.toString();
            } catch {
              window.location.href = returnUrl;
            }
          }, 1500);
        }
      } catch (err: unknown) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Network error during exchange";
        setMessage(msg);
      }
    }

    void handleExchange();
  }, [code, rawState, error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl">
        {status === "loading" && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-semibold text-white">Connecting WhatsApp</h2>
            <p className="text-xs text-slate-400 font-mono">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h2 className="text-base font-semibold text-white">Connected!</h2>
            {phoneInfo && <p className="text-xs text-emerald-400 font-mono font-medium">{phoneInfo}</p>}
            <p className="text-xs text-slate-400">Closing window automatically...</p>
            <button
              onClick={() => window.close()}
              className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 cursor-pointer"
            >
              Close Window
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <h2 className="text-base font-semibold text-red-400">Connection Failed</h2>
            <p className="text-xs text-slate-300">{message}</p>
            <button
              onClick={() => window.close()}
              className="mt-3 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg border border-slate-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OnboardCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Completing WhatsApp authorization...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
