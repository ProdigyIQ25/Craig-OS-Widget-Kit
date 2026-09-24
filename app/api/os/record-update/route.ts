import { NextResponse } from "next/server";
import { writeNotAuthorized } from "@/lib/phase15/api";
import type { CaptureContext, CaptureDestinationKey } from "@/lib/phase15/governed-action";
import { isSpiritualDestination } from "@/lib/phase15/governed-action";
import {
  GOVERNED_UPDATE_VERSION,
  buildUpdatePreview,
  validateRecordUpdate,
  type GovernedRecordUpdateRequest,
  type GovernedUpdatePatch,
} from "@/lib/phase15/governed-update";
import { authorizeWrite } from "@/lib/phase15/operator";
import { PHASE15_CONTRACT_VERSION } from "@/lib/phase15/semantic";
import { CANONICAL_DATABASES } from "@/lib/phase15/databases";
import { captureRateLimit, validateCaptureRequest } from "@/lib/server/phase15-capture-security";
import { Phase15RecordUpdateError, updatePhase15Record } from "@/lib/server/phase15-record-update";
import { runIdempotent, requestFingerprint } from "@/lib/server/action-idempotency";

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
      updateVersion: GOVERNED_UPDATE_VERSION,
      generatedAt: new Date().toISOString(),
      upstream: "UNBOUND",
      error: { code, message },
      errorCode: code,
    },
    { status, headers: NO_STORE },
  );
}

function asPatch(value: unknown): GovernedUpdatePatch | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const patch: GovernedUpdatePatch = {};
  for (const key of ["status", "priority", "dueDate", "stage"] as const) {
    if (typeof record[key] === "string" && record[key]) patch[key] = record[key] as string;
  }
  return Object.keys(patch).length ? patch : null;
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
    return fail(403, "WRITE_NOT_AUTHORIZED", "Record update was not authorized.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "VALIDATION_FAILED", "Update body must be JSON.");
  }

  const draft = body as Partial<GovernedRecordUpdateRequest>;
  if (draft.actionId !== "RECORD_UPDATE") {
    return fail(403, "WRITE_NOT_AUTHORIZED", "Only governed record update is authorized on this route.");
  }

  const destinationKey = draft.destinationKey as CaptureDestinationKey | undefined;
  if (!destinationKey || !DESTINATION_KEYS.has(destinationKey)) {
    return fail(400, "DESTINATION_UNKNOWN", "Unknown update destination.");
  }

  const recordId = typeof draft.recordId === "string" ? draft.recordId.trim() : "";
  const patch = asPatch(draft.patch);
  if (!patch) return fail(400, "VALIDATION_FAILED", "At least one patch field is required.");

  const context = draft.context as CaptureContext | undefined;
  if (context !== "personal" && context !== "business" && context !== "spiritual") {
    return fail(400, "CONTEXT_REQUIRED", "Update context is required.");
  }

  const validation = validateRecordUpdate({
    context,
    destinationKey,
    recordId,
    patch,
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
    evidence: draft.evidence === "DAVID_COMMITMENT" || draft.evidence === "FACT" ? draft.evidence : "DAVID_DECISION",
    context,
    destination: spiritualDestination,
    explicitSave: draft.explicitSpiritualSave === true,
    searchedBeforeCreate: draft.searchedBeforeCreate === true,
    confirmed: draft.authorized === true,
  });

  if (!decision.allowed) {
    return fail(403, decision.code, "Record update was not authorized.");
  }

  if (!draft.idempotencyKey || typeof draft.idempotencyKey !== "string" || draft.idempotencyKey.length < 8) {
    return fail(400, "VALIDATION_FAILED", "Idempotency key is required.");
  }

  if (!captureRateLimit(request, `update:${destinationKey}`)) {
    return fail(429, "RATE_LIMITED", "Updates are temporarily paused. Nothing was changed.");
  }

  const titleHint =
    typeof draft.baseline === "object" && draft.baseline && typeof (draft.baseline as { title?: string }).title === "string"
      ? (draft.baseline as { title: string }).title
      : destinationKey;

  const preview = buildUpdatePreview({
    context,
    destinationKey,
    title: titleHint,
    patch,
    baseline: draft.baseline,
  });

  const fingerprint = requestFingerprint(`phase15-update:${destinationKey}`, {
    recordId,
    status: patch.status ?? "",
    priority: patch.priority ?? "",
    dueDate: patch.dueDate ?? "",
    stage: patch.stage ?? "",
  });

  try {
    const result = await runIdempotent(
      `phase15-update:${destinationKey}`,
      draft.idempotencyKey,
      fingerprint,
      () =>
        updatePhase15Record({
          recordId,
          destinationKey,
          context,
          patch,
          explicitSpiritualSave: draft.explicitSpiritualSave === true,
          titleHint,
        }).then((updated) => ({
          ok: true as const,
          actionId: `phase15-update:${destinationKey}`,
          recordId: updated.recordId,
          recordUrl: updated.recordUrl,
          createdAt: updated.updatedAt,
        })),
    );

    // Re-read for response body (idempotent replay still returns ids; prefer fresh detail when possible)
    let readBack = null;
    try {
      const { readPhase15Record } = await import("@/lib/server/phase15-record-read");
      readBack = await readPhase15Record({
        recordId: result.recordId,
        destinationKey,
        context,
        explicitSpiritual: draft.explicitSpiritualSave === true || context === "spiritual",
      });
    } catch {
      readBack = null;
    }

    return NextResponse.json(
      {
        ok: true,
        data: {
          destinationKey,
          destinationLabel: preview?.destinationLabel ?? destinationKey,
          recordId: result.recordId,
          recordUrl: result.recordUrl,
          title: readBack?.title ?? titleHint,
          patch,
          preview,
          readBack,
          sensitivity: isSpiritualDestination(destinationKey) ? "spiritual" : "standard",
          updatedAt: result.createdAt,
        },
        source: "live",
        version: PHASE15_CONTRACT_VERSION,
        updateVersion: GOVERNED_UPDATE_VERSION,
        generatedAt: new Date().toISOString(),
        upstream: "LIVE",
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_REQUEST") {
      return fail(409, "DUPLICATE_REQUEST", "Idempotency key conflict.");
    }
    if (error instanceof Phase15RecordUpdateError) {
      const status = error.code === "UPSTREAM_UNAVAILABLE" ? 503 : error.code === "READ_BACK_FAILED" ? 502 : 502;
      return NextResponse.json(
        {
          ok: false,
          data: null,
          source: "system",
          version: PHASE15_CONTRACT_VERSION,
          updateVersion: GOVERNED_UPDATE_VERSION,
          generatedAt: new Date().toISOString(),
          upstream: "LIVE",
          error: { code: error.code, message: error.message },
          errorCode: error.code,
          upstreamStatus: error.upstreamStatus ?? null,
          upstreamHint: error.upstreamHint ?? null,
        },
        { status, headers: NO_STORE },
      );
    }
    return fail(503, "MUTATION_FAILED", "Record update failed.");
  }
}
