import { type NextRequest, NextResponse } from "next/server";
import { gatewayConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 },
    );
  }

  if (!body?.code || typeof body.code !== "string" || !body.code.trim()) {
    return NextResponse.json(
      { error: "Missing required 'code' parameter in exchange request" },
      { status: 400 },
    );
  }

  const targetUrl = `${gatewayConfig.wgMessagingUrl}/v1/connections/exchange`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), gatewayConfig.fetchTimeoutMs);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": gatewayConfig.wgApiKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    let data: unknown;

    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => ({}));
    } else {
      const rawText = await res.text().catch(() => "");
      console.warn("[api/connections/exchange] Backend returned non-JSON response:", res.status, rawText);
      data = { error: "Non-JSON response from backend", raw: rawText };
    }

    if (!res.ok) {
      console.error("[api/connections/exchange] Backend exchange error:", res.status, data);
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    const errorMessage = isAbort
      ? `Backend request timed out after ${gatewayConfig.fetchTimeoutMs / 1000}s`
      : err instanceof Error
        ? err.message
        : "Unknown network error";

    console.error("[api/connections/exchange] Failed to forward exchange request:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to connect to wg-messaging backend for token exchange",
        backend_url: gatewayConfig.wgMessagingUrl,
        details: errorMessage,
      },
      { status: 503 },
    );
  }
}
