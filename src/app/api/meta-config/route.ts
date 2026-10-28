import { NextResponse } from "next/server";
import { gatewayConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const targetUrl = `${gatewayConfig.wgMessagingUrl}/v1/connections/config`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(targetUrl, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    if (!res.ok) {
      let errorBody: unknown = null;
      if (contentType.includes("application/json")) {
        errorBody = await res.json().catch(() => null);
      } else {
        errorBody = await res.text().catch(() => null);
      }

      console.error("[api/meta-config] Backend returned non-OK status:", res.status, errorBody);

      return NextResponse.json(
        {
          error: "Backend failed to provide Meta configuration",
          backend_status: res.status,
          details: errorBody,
        },
        { status: res.status >= 500 ? 502 : res.status },
      );
    }

    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        {
          error: "Backend returned invalid non-JSON content type",
          details: await res.text().catch(() => ""),
        },
        { status: 502 },
      );
    }

    const data = await res.json();
    if (!data?.app_id) {
      return NextResponse.json(
        {
          error: "Backend returned incomplete Meta configuration (missing app_id)",
          details: data,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const errorMessage = isAbort
      ? `Timed out after 8s connecting to backend at ${gatewayConfig.wgMessagingUrl}`
      : err instanceof Error
        ? err.message
        : "Unknown network error";

    console.error("[api/meta-config] Failed to reach backend:", errorMessage);

    return NextResponse.json(
      {
        error: "Messaging backend is currently unreachable",
        backend_url: gatewayConfig.wgMessagingUrl,
        details: errorMessage,
      },
      { status: 503 },
    );
  }
}
