import { NextResponse } from "next/server";
import type { CaptureContext, CaptureDestinationKey } from "@/lib/phase15/governed-action";
import { CANONICAL_DATABASES } from "@/lib/phase15/databases";
import { PHASE15_CONTRACT_VERSION } from "@/lib/phase15/semantic";
import { RECORD_DETAIL_VERSION } from "@/lib/phase15/record-detail";
import { Phase15RecordReadError, readPhase15Record } from "@/lib/server/phase15-record-read";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };
const DESTINATION_KEYS = new Set(CANONICAL_DATABASES.map((item) => item.key));

function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      data: null,
      source: "system",
      version: PHASE15_CONTRACT_VERSION,
      recordVersion: RECORD_DETAIL_VERSION,
      generatedAt: new Date().toISOString(),
      upstream: "UNBOUND",
      error: { code, message },
      errorCode: code,
    },
    { status, headers: NO_STORE },
  );
}

export async function GET(request?: Request) {
  if (!request) return fail(400, "VALIDATION_FAILED", "Record read requires an HTTP request.");

  const url = new URL(request.url);
  const recordId = url.searchParams.get("recordId")?.trim() ?? "";
  const destinationKey = url.searchParams.get("destinationKey") as CaptureDestinationKey | null;
  const context = url.searchParams.get("context") as CaptureContext | null;
  const explicitSpiritual = url.searchParams.get("explicitSpiritual") === "true";

  if (!recordId) return fail(400, "VALIDATION_FAILED", "recordId is required.");
  if (!destinationKey || !DESTINATION_KEYS.has(destinationKey)) {
    return fail(400, "VALIDATION_FAILED", "destinationKey is required.");
  }
  if (context !== "personal" && context !== "business" && context !== "spiritual") {
    return fail(400, "CONTEXT_REQUIRED", "context is required.");
  }

  try {
    const detail = await readPhase15Record({
      recordId,
      destinationKey,
      context,
      explicitSpiritual,
    });
    return NextResponse.json(
      {
        ok: true,
        data: detail,
        source: "live",
        version: PHASE15_CONTRACT_VERSION,
        recordVersion: RECORD_DETAIL_VERSION,
        generatedAt: new Date().toISOString(),
        upstream: "LIVE",
        error: null,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof Phase15RecordReadError) {
      const status =
        error.code === "RECORD_NOT_FOUND"
          ? 404
          : error.code === "ACCESS_DENIED" || error.code === "CROSS_CONTEXT"
            ? 403
            : error.code === "UPSTREAM_UNAVAILABLE"
              ? 503
              : 400;
      return fail(status, error.code, error.message);
    }
    return fail(503, "UPSTREAM_UNAVAILABLE", "Record retrieval failed.");
  }
}
