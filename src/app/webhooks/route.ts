import { type NextRequest, NextResponse } from "next/server";
import { gatewayConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

// Handle Meta Webhook Verification (hub.mode, hub.verify_token, hub.challenge)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const targetUrl = new URL(`${gatewayConfig.wgMessagingUrl}/webhooks${url.search}`);

    const res = await fetch(targetUrl.toString(), {
      method: "GET",
      cache: "no-store",
    });

    const bodyText = await res.text();
    return new NextResponse(bodyText, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "text/plain" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhooks-proxy] Failed to verify webhook with backend:", message);
    return new NextResponse(`Webhook verification proxy error: ${message}`, { status: 502 });
  }
}

// Handle Inbound Meta Webhook Events (forward raw bytes and signature intact)
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.arrayBuffer();

    const headers: Record<string, string> = {
      "Content-Type": request.headers.get("content-type") || "application/json",
    };

    const signature = request.headers.get("x-hub-signature-256");
    if (signature) {
      headers["x-hub-signature-256"] = signature;
    }

    const res = await fetch(`${gatewayConfig.wgMessagingUrl}/webhooks`, {
      method: "POST",
      headers,
      body: rawBody,
    });

    const bodyText = await res.text();
    return new NextResponse(bodyText, {
      status: res.status,
      headers: { "Content-Type": res.headers.get("Content-Type") || "text/plain" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhooks-proxy] Failed to forward webhook payload to backend:", message);
    return new NextResponse(`Webhook forward error: ${message}`, { status: 502 });
  }
}
