"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface ExchangeResult {
  status?: string;
  error?: string;
  code?: string;
  details?: unknown;
  connection?: {
    id?: number | string;
    workspace_id?: string;
    phone_number_id?: string;
    display_phone_number?: string;
    verified_name?: string;
  };
}

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Meta OAuth return params
  const code = searchParams.get("code");
  const rawState = searchParams.get("state") || "default";
  const metaError = searchParams.get("error");
  const metaErrorReason = searchParams.get("error_reason");
  const metaErrorDescription = searchParams.get("error_description");
  const metaErrorCode = searchParams.get("error_code");

  const isDirect = !code && !metaError && !metaErrorReason && !metaErrorDescription;
  const [status, setStatus] = useState<"loading" | "success" | "error">(isDirect ? "error" : "loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    isDirect ? "Direct Access Prohibited (403)" : null,
  );
  const [errorDetails, setErrorDetails] = useState<string | null>(
    isDirect ? "The callback endpoint requires an active Meta OAuth transaction." : null,
  );
  const [phoneInfo, setPhoneInfo] = useState<string | null>(null);

  // Parse state parameters
  const parsedState = useMemo(() => {
    try {
      return JSON.parse(rawState) as {
        workspace_id?: string;
        session_id?: string;
        return_url?: string;
        app_name?: string;
      };
    } catch {
      return { workspace_id: rawState };
    }
  }, [rawState]);

  const workspaceId = parsedState.workspace_id || "default";
  const sessionId = parsedState.session_id;
  const returnUrl = parsedState.return_url;

  useEffect(() => {
    // 1. Check for Meta OAuth rejection / cancellation
    if (metaError || metaErrorReason || metaErrorDescription) {
      setStatus("error");
      const isDenied =
        metaError === "access_denied" ||
        metaErrorReason === "user_denied" ||
        metaErrorDescription?.toLowerCase().includes("denied");

      const title = isDenied
        ? "WhatsApp Authorization Cancelled"
        : "Meta Authorization Failed";

      const details =
        metaErrorDescription ||
        metaErrorReason ||
        metaError ||
        "You cancelled or declined the permissions requested by WhatsApp.";

      setErrorMessage(title);
      setErrorDetails(details);

      // Notify parent window
      if (window.opener) {
        try {
          window.opener.postMessage(
            {
              type: "WA_ONBOARDING_ERROR",
              workspace_id: workspaceId,
              error: title,
              details,
              code: metaErrorCode || metaError || "AUTH_CANCELLED",
            },
            "*",
          );
        } catch (e) {
          console.warn("[callback] Could not notify opener of error:", e);
        }
      }
      return;
    }

    // 2. Check for missing OAuth code / Direct URL access
    if (!code) {
      setStatus("error");
      setErrorMessage("Direct Access Prohibited (403)");
      setErrorDetails("The callback endpoint cannot be accessed directly without an active Meta authorization transaction.");

      if (window.opener) {
        try {
          window.opener.postMessage(
            {
              type: "WA_ONBOARDING_ERROR",
              workspace_id: workspaceId,
              error: "Missing authorization code",
              code: "MISSING_CODE",
            },
            "*",
          );
        } catch (e) {
          console.warn("[callback] Could not notify opener:", e);
        }
      }
      return;
    }

    // 3. Perform Backend Token Exchange
    async function exchangeToken() {
      try {
        const redirectUri = `${window.location.origin}/onboard/callback`;
        const res = await fetch("/api/connections/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code,
            workspace_id: workspaceId,
            session_id: sessionId,
            redirect_uri: redirectUri,
          }),
        });

        const data: ExchangeResult = await res.json().catch(() => ({}));

        if (!res.ok) {
          setStatus("error");

          if (data.code === "WORKSPACE_CONFLICT") {
            setErrorMessage("Phone Number Conflict");
            setErrorDetails(
              data.error ||
                "This phone number is already registered under another workspace. Disconnect it first or transfer ownership.",
            );
          } else if (res.status === 400 && data.error?.includes("phone_number_id")) {
            setErrorMessage("No Phone Number Found");
            setErrorDetails(
              "No WhatsApp Business phone numbers were found in the selected account. Please add a phone number in Meta Business Manager and try again.",
            );
          } else if (res.status === 503) {
            setErrorMessage("Backend Unreachable");
            setErrorDetails("Could not connect to the wg-messaging backend service.");
          } else {
            setErrorMessage(data.error || "Failed to register WhatsApp connection");
            if (data.details) {
              setErrorDetails(
                typeof data.details === "string" ? data.details : JSON.stringify(data.details),
              );
            }
          }

          // Notify opener of exchange error
          if (window.opener) {
            try {
              window.opener.postMessage(
                {
                  type: "WA_ONBOARDING_ERROR",
                  workspace_id: workspaceId,
                  error: data.error || "Failed to register WhatsApp connection",
                  code: data.code || `HTTP_${res.status}`,
                  details: data.details,
                },
                "*",
              );
            } catch (e) {
              console.warn("[callback] Could not notify opener of exchange error:", e);
            }
          }
          return;
        }

        // Handle successful registration
        setStatus("success");
        const phone =
          data.connection?.display_phone_number ||
          data.connection?.phone_number_id ||
          "WhatsApp Number";
        setPhoneInfo(phone);

        // Notify parent window of success
        if (window.opener) {
          try {
            window.opener.postMessage(
              {
                type: "WA_ONBOARDING_SUCCESS",
                workspace_id: workspaceId,
                session_id: sessionId,
                connection_id: data.connection?.id ? `conn_${data.connection.id}` : undefined,
                connection: data.connection,
                phone_registered: data.status === "connected",
              },
              "*",
            );
          } catch (e) {
            console.warn("[callback] Could not postMessage to opener:", e);
          }

          // Auto-close popup after 1.5 seconds
          setTimeout(() => {
            window.close();
          }, 1500);
        } else if (returnUrl) {
          // In full-page redirect mode, redirect to partner's return_url
          setTimeout(() => {
            try {
              const dest = new URL(returnUrl);
              dest.searchParams.set("status", "success");
              if (data.connection?.id) {
                dest.searchParams.set("connection_id", String(data.connection.id));
              }
              window.location.href = dest.toString();
            } catch {
              window.location.href = returnUrl;
            }
          }, 1500);
        }
      } catch (err: unknown) {
        setStatus("error");
        const msg = err instanceof Error ? err.message : "Network error during token exchange";
        setErrorMessage("Connection Exchange Failed");
        setErrorDetails(msg);

        if (window.opener) {
          try {
            window.opener.postMessage(
              {
                type: "WA_ONBOARDING_ERROR",
                workspace_id: workspaceId,
                error: msg,
                code: "NETWORK_ERROR",
              },
              "*",
            );
          } catch (e) {
            console.warn("[callback] Could not notify opener:", e);
          }
        }
      }
    }

    void exchangeToken();
  }, [code, metaError, metaErrorReason, metaErrorDescription, metaErrorCode, workspaceId, returnUrl]);

  const handleRetry = () => {
    const params = new URLSearchParams();
    if (workspaceId) params.set("workspace_id", workspaceId);
    if (returnUrl) params.set("return_url", returnUrl);
    if (parsedState.app_name) params.set("app_name", parsedState.app_name);
    router.push(`/onboard?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl relative overflow-hidden">
        {status === "loading" && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 border-3 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin mx-auto" />
            <h2 className="text-base font-semibold text-white">Connecting WhatsApp Account</h2>
            <p className="text-xs text-slate-400 font-mono">Exchanging credentials with Meta...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4 py-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold shadow-inner">
              ✓
            </div>
            <h2 className="text-base font-semibold text-white">Connected Successfully!</h2>
            {phoneInfo && (
              <p className="text-xs text-emerald-400 font-mono font-medium">{phoneInfo}</p>
            )}
            <p className="text-xs text-slate-400">Closing this window automatically...</p>
            <button
              onClick={() => window.close()}
              className="mt-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 cursor-pointer"
            >
              Close Window
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 py-2">
            <div className="w-12 h-12 bg-red-500/20 border border-red-500/40 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
              ✕
            </div>
            <h2 className="text-base font-semibold text-red-400">{errorMessage || "Connection Failed"}</h2>
            {errorDetails && (
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-left">
                <p className="text-xs text-red-200/90 break-words">{errorDetails}</p>
              </div>
            )}
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleRetry}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition"
              >
                ↻ Try Again
              </button>
              <button
                type="button"
                onClick={() => window.close()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 cursor-pointer transition"
              >
                Close Window
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-xs">
          Completing WhatsApp setup...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
