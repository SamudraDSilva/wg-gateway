import { type NextRequest, NextResponse } from "next/server";

const WG_MESSAGING_URL = process.env.WG_MESSAGING_URL || "http://localhost:20080";
const WG_API_KEY = process.env.WG_API_KEY || "local_development_key";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const res = await fetch(`${WG_MESSAGING_URL}/v1/connections/exchange`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": WG_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[api/connections/exchange] wg-messaging returned error:", res.status, data);
    }
    return NextResponse.json(data, { status: res.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to forward exchange request to wg-messaging", details: message },
      { status: 502 },
    );
  }
}
