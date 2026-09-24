import { NextResponse } from "next/server";
import { ASK_CONTRACT_VERSION, type AskRequest, type AskSurfaceContext } from "@/lib/phase15/ask";
import { PHASE15_CONTRACT_VERSION } from "@/lib/phase15/semantic";
import { runAskCraigOs } from "@/lib/server/phase15-ask";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

const SURFACES = new Set<AskSurfaceContext>(["home", "personal", "business", "spiritual"]);

function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      data: null,
      source: "system",
      version: PHASE15_CONTRACT_VERSION,
      askVersion: ASK_CONTRACT_VERSION,
      generatedAt: new Date().toISOString(),
      upstream: "UNBOUND",
      error: { code, message },
      errorCode: code,
    },
    { status, headers: NO_STORE },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      data: {
        available: true,
        writePaths: 0,
        mutationPath: "BU-15.7 /api/os/capture only",
        version: ASK_CONTRACT_VERSION,
      },
      source: "system",
      version: PHASE15_CONTRACT_VERSION,
      generatedAt: new Date().toISOString(),
      error: null,
    },
    { headers: NO_STORE },
  );
}

export async function POST(request?: Request) {
  if (!request) return fail(403, "WRITE_NOT_AUTHORIZED", "Ask requires an HTTP request.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "VALIDATION_ERROR", "Ask body must be JSON.");
  }

  const draft = body as Partial<AskRequest>;
  const message = typeof draft.message === "string" ? draft.message : "";
  const surface = draft.surface;
  if (!surface || !SURFACES.has(surface)) {
    return fail(400, "VALIDATION_ERROR", "Ask surface context is required.");
  }

  // Hard guarantee: this route never forwards to Notion write endpoints.
  const result = await runAskCraigOs({
    message,
    surface,
    context: draft.context && SURFACES.has(draft.context) ? draft.context : undefined,
  });

  const softOk =
    result.ok ||
    result.errorCode === "AUTHORIZATION_REQUIRED" ||
    result.errorCode === "NO_MATCHING_DATA" ||
    result.errorCode === "CONTEXT_AMBIGUOUS";

  let status = 200;
  if (result.errorCode === "VALIDATION_ERROR") status = 400;
  else if (result.errorCode === "RETRIEVAL_UNAVAILABLE") status = 503;
  else if (!softOk) status = 503;

  return NextResponse.json(
    {
      ok: softOk,
      data: result,
      source: "live",
      version: PHASE15_CONTRACT_VERSION,
      askVersion: ASK_CONTRACT_VERSION,
      generatedAt: new Date().toISOString(),
      upstream: result.errorCode === "RETRIEVAL_UNAVAILABLE" ? "UNBOUND" : "LIVE",
      error: softOk ? null : { code: result.errorCode, message: result.answer },
      errorCode: result.errorCode,
    },
    { status, headers: NO_STORE },
  );
}
