import { NextResponse } from "next/server";

const WG_MESSAGING_URL = process.env.WG_MESSAGING_URL || "http://localhost:20080";

export async function GET() {
  try {
    const res = await fetch(`${WG_MESSAGING_URL}/v1/connections/config`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend failed to return Meta config", status: res.status },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to connect to wg-messaging backend for Meta config", details: message },
      { status: 502 },
    );
  }
}
