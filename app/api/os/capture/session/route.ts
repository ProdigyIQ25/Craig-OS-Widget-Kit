import { NextResponse } from "next/server";
import { createCaptureSession } from "@/lib/server/phase15-capture-security";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = createCaptureSession();
    const response = NextResponse.json(
      { ok: true, csrfToken: session.token, expiresAt: session.expiresAt },
      { headers: { "Cache-Control": "private, no-store" } },
    );
    response.cookies.set(session.cookieName, session.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/os",
      maxAge: session.maxAge,
    });
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, errorCode: "UPSTREAM_UNAVAILABLE" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
