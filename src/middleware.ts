import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // 1. Strict protection for OAuth callback:
  // Must contain an active Meta authorization code or an explicit Meta error.
  // Direct typing of "/onboard/callback" returns HTTP 403 immediately.
  if (pathname === "/onboard/callback") {
    const hasCode = searchParams.has("code") && (searchParams.get("code")?.trim().length || 0) > 0;
    const hasMetaError =
      searchParams.has("error") ||
      searchParams.has("error_description") ||
      searchParams.has("error_reason");

    if (!hasCode && !hasMetaError) {
      const blockedUrl = new URL("/blocked", request.url);
      blockedUrl.searchParams.set("reason", "callback_direct_access");
      return NextResponse.rewrite(blockedUrl, { status: 403 });
    }
  }

  // 2. Strict protection for Onboarding launcher:
  // Must have an explicit workspace_id or session_id query parameter.
  // Direct typing of "/onboard" returns HTTP 403 immediately.
  if (pathname === "/onboard") {
    const hasWorkspace =
      searchParams.has("workspace_id") &&
      (searchParams.get("workspace_id")?.trim().length || 0) > 0;
    const hasSession =
      searchParams.has("session_id") &&
      (searchParams.get("session_id")?.trim().length || 0) > 0;

    if (!hasWorkspace && !hasSession) {
      const blockedUrl = new URL("/blocked", request.url);
      blockedUrl.searchParams.set("reason", "onboard_direct_access");
      return NextResponse.rewrite(blockedUrl, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/onboard", "/onboard/callback"],
};
