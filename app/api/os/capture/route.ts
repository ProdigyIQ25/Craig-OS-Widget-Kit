import { NextResponse } from "next/server";
import { writeNotAuthorized } from "@/lib/phase15/api";
import {
  buildMutationPreview,
  type CaptureDestinationKey,
  type GovernedCapturePayload,
  type GovernedCaptureRequest,
  validateCapturePayload,
} from "@/lib/phase15/governed-action";
import { authorizeWrite } from "@/lib/phase15/operator";
import { PHASE15_CONTRACT_VERSION } from "@/lib/phase15/semantic";
import { CANONICAL_DATABASES } from "@/lib/phase15/databases";
import { aggregateResponse } from "@/lib/phase15/http";
import { captureRateLimit, validateCaptureRequest } from "@/lib/server/phase15-capture-security";
import { createPhase15CaptureRecord, Phase15CaptureWriteError } from "@/lib/server/phase15-capture-write";
import { runIdempotent, requestFingerprint } from "@/lib/server/action-idempotency";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "private, no-store" };

const DESTINATION_KEYS = new Set(
  CANONICAL_DATABASES.map((item) => item.key),
);

function fail(status: number, code: string, message: string) {
  return NextResponse.json(
    {
      ok: false,
      data: null,
      source: "system",
      version: PHASE15_CONTRACT_VERSION,
      generatedAt: new Date().toISOString(),
      upstream: "UNBOUND",
      error: { code, message },
      errorCode: code,
    },
    { status, headers: NO_STORE },
  );
}

function asPayload(value: unknown): GovernedCapturePayload | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string") return null;
  const payload: GovernedCapturePayload = { title: record.title };
  for (const key of [
    "status",
    "summary",
    "dueDate",
    "priority",
    "stage",
    "type",
    "severity",
    "domain",
    "email",
    "role",
    "relationship",
    "value",
    "relatedProjectId",
    "relatedGoalId",
    "relatedCompanyId",
    "relatedPersonId",
  ] as const) {
    if (typeof record[key] === "string" && record[key]) payload[key] = record[key] as string;
  }
  return payload;
}

export function GET() {
  return aggregateResponse("/api/os/capture");
}

export async function POST(request?: Request) {
  if (!request) {
    return NextResponse.json(writeNotAuthorized(), { status: 403, headers: NO_STORE });
  }

  let authorized = false;
  try {
    authorized = validateCaptureRequest(request);
  } catch {
    authorized = false;
  }
  if (!authorized) {
    return fail(403, "WRITE_NOT_AUTHORIZED", "Capture write was not authorized.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "VALIDATION_ERROR", "Capture body must be JSON.");
  }

  const draft = body as Partial<GovernedCaptureRequest>;
  if (draft.actionId !== "CAPTURE_CREATE") {
    return fail(403, "WRITE_NOT_AUTHORIZED", "Only governed capture create is authorized.");
  }

  const destinationKey = draft.destinationKey as CaptureDestinationKey | undefined;
  if (!destinationKey || !DESTINATION_KEYS.has(destinationKey)) {
    return fail(400, "DESTINATION_UNKNOWN", "Unknown capture destination.");
  }

  const payload = asPayload(draft.payload);
  if (!payload) return fail(400, "VALIDATION_ERROR", "A title is required.");

  const context = draft.context;
  if (context !== "personal" && context !== "business" && context !== "spiritual") {
    return fail(400, "CONTEXT_REQUIRED", "Capture context is required.");
  }

  const validation = validateCapturePayload({
    context,
    destinationKey,
    payload,
    explicitSpiritualSave: draft.explicitSpiritualSave === true,
  });
  if (!validation.ok) {
    return fail(400, validation.code, validation.message);
  }

  const spiritualDestination =
    destinationKey === "personal.prayer"
      ? "prayer"
      : destinationKey === "personal.spiritual-journal"
        ? "spiritual-journal"
        : "standard";

  const decision = authorizeWrite({
    evidence: draft.evidence === "RECOMMENDATION" ? "RECOMMENDATION" : "DAVID_DECISION",
    context,
    destination: spiritualDestination,
    explicitSave: draft.explicitSpiritualSave === true,
    searchedBeforeCreate: draft.searchedBeforeCreate === true,
    confirmed: draft.authorized === true,
  });

  if (!decision.allowed) {
    return fail(403, decision.code, "Capture write was not authorized.");
  }

  if (!draft.idempotencyKey || typeof draft.idempotencyKey !== "string" || draft.idempotencyKey.length < 8) {
    return fail(400, "VALIDATION_ERROR", "Idempotency key is required.");
  }

  if (!captureRateLimit(request, destinationKey)) {
    return fail(429, "RATE_LIMITED", "Capture is temporarily paused. Nothing was saved.");
  }

  const preview = buildMutationPreview({ context, destinationKey, payload });
  const database = CANONICAL_DATABASES.find((item) => item.key === destinationKey);
  if (!database || !preview) {
    return fail(400, "DESTINATION_UNKNOWN", "Unknown capture destination.");
  }

  const fingerprint = requestFingerprint(`phase15-capture:${destinationKey}`, {
    title: payload.title,
    context,
    summary: payload.summary ?? "",
    dueDate: payload.dueDate ?? "",
  });

  try {
    const result = await runIdempotent(
      `phase15-capture:${destinationKey}`,
      draft.idempotencyKey,
      fingerprint,
      () =>
        createPhase15CaptureRecord({
          destinationKey,
          payload,
          titleProperty: database.titleProperty,
        }).then((created) => ({
          ok: true as const,
          actionId: `phase15-capture:${destinationKey}`,
          recordId: created.recordId,
          recordUrl: created.recordUrl,
          createdAt: created.createdAt,
        })),
    );

    return NextResponse.json(
      {
        ok: true,
        data: {
          destinationKey,
          destinationLabel: preview.destinationLabel,
          title: payload.title.trim(),
          recordId: result.recordId,
          recordUrl: result.recordUrl,
          createdAt: result.createdAt,
          preview,
        },
        source: "live",
        version: PHASE15_CONTRACT_VERSION,
        generatedAt: new Date().toISOString(),
        upstream: "LIVE",
      },
      { status: 200, headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_REQUEST") {
      return fail(409, "DUPLICATE_REQUEST", "This capture was already submitted with different content.");
    }
    if (error instanceof Phase15CaptureWriteError) {
      const status = error.code === "UPSTREAM_UNAVAILABLE" || error.code === "DESTINATION_UNBOUND" ? 503 : 502;
      const response = fail(status, error.code, `${error.message} Nothing was saved.`);
      if (error.upstreamStatus || error.upstreamHint) {
        const body = await response.json();
        return NextResponse.json(
          {
            ...body,
            upstreamStatus: error.upstreamStatus ?? null,
            upstreamHint: error.upstreamHint ?? null,
          },
          { status, headers: NO_STORE },
        );
      }
      return response;
    }
    return fail(502, "WRITE_FAILED", "Could not capture this record. Nothing was saved.");
  }
}
