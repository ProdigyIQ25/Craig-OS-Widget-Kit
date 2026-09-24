"use client";

import { type FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import type { CaptureContext, CaptureDestinationKey } from "@/lib/phase15/governed-action";
import { buildUpdatePreview, type GovernedUpdatePatch } from "@/lib/phase15/governed-update";
import {
  destinationKeyFromKind,
  type RecordDetail,
  type RecordQuickEditField,
} from "@/lib/phase15/record-detail";
import type { CommandRecord } from "@/lib/phase15/ui-models";
import { DeepEditLink } from "./primitives";

type DrawerStep = "view" | "edit" | "preview" | "success" | "failure";

export type RecordInspectSeed = {
  patch?: GovernedUpdatePatch;
  startAtPreview?: boolean;
};

function useIsNarrow(breakpoint = 768) {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setNarrow(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [breakpoint]);
  return narrow;
}

function resolveDestination(record: CommandRecord): CaptureDestinationKey | null {
  return record.destinationKey ?? destinationKeyFromKind(record.kind, record.context);
}

function resolveContext(
  surface: "home" | "personal" | "business" | "spiritual",
  record: CommandRecord,
  explicitSpiritual: boolean,
): CaptureContext {
  if (surface === "spiritual" || explicitSpiritual) return "spiritual";
  if (surface === "business" || record.context === "business") return "business";
  return "personal";
}

export function RecordInspect({
  record,
  open,
  onClose,
  contextLabel,
  surface = "home",
  explicitSpiritual = false,
  seed = null,
  onSeedConsumed,
}: {
  record: CommandRecord | null;
  open: boolean;
  onClose: () => void;
  contextLabel: string;
  surface?: "home" | "personal" | "business" | "spiritual";
  explicitSpiritual?: boolean;
  seed?: RecordInspectSeed | null;
  onSeedConsumed?: () => void;
}) {
  const narrow = useIsNarrow();
  const panelRef = useRef<HTMLElement>(null);
  const statusId = useId();
  const priorityId = useId();
  const dueId = useId();
  const stageId = useId();
  const [detail, setDetail] = useState<RecordDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<DrawerStep>("view");
  const [patch, setPatch] = useState<GovernedUpdatePatch>({});
  const [executing, setExecuting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const idempotencyKey = useRef("");
  const loadGen = useRef(0);

  const destinationKey = record ? resolveDestination(record) : null;
  const updateContext = record ? resolveContext(surface, record, explicitSpiritual) : "personal";

  useEffect(() => {
    if (!open || !record || !destinationKey) {
      setDetail(null);
      setLoadError(null);
      setLoading(false);
      setStep("view");
      setPatch({});
      setResultMessage(null);
      return;
    }

    const generation = ++loadGen.current;
    setLoading(true);
    setLoadError(null);
    setDetail(null);
    setStep("view");
    setPatch({});
    setResultMessage(null);

    const params = new URLSearchParams({
      recordId: record.id,
      destinationKey,
      context: updateContext,
    });
    if (explicitSpiritual || updateContext === "spiritual") params.set("explicitSpiritual", "true");

    void fetch(`/api/os/record?${params.toString()}`, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as {
          ok: boolean;
          data?: RecordDetail;
          error?: { message?: string; code?: string };
          errorCode?: string;
        };
        if (generation !== loadGen.current) return;
        if (!body.ok || !body.data) {
          setLoadError(body.error?.message ?? body.errorCode ?? "Record could not be loaded.");
          setDetail(null);
          return;
        }
        setDetail(body.data);
      })
      .catch(() => {
        if (generation !== loadGen.current) return;
        setLoadError("Record retrieval is unavailable.");
      })
      .finally(() => {
        if (generation === loadGen.current) setLoading(false);
      });
  }, [open, record, destinationKey, updateContext, explicitSpiritual]);

  useEffect(() => {
    if (!open || !seed || !detail) return;
    if (seed.patch) setPatch(seed.patch);
    if (seed.startAtPreview) setStep("preview");
    else if (seed.patch) setStep("edit");
    onSeedConsumed?.();
  }, [open, seed, detail, onSeedConsumed]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>("button, a[href], input, select, textarea");
    focusable?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !executing) onClose();
      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(
        panel.querySelectorAll<HTMLElement>("button, a[href], input, select, textarea"),
      ).filter((node) => !node.hasAttribute("disabled"));
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [open, onClose, executing, step, detail, loading]);

  const editableFields: RecordQuickEditField[] = detail?.allowedActions.fields ?? [];
  const preview = useMemo(() => {
    if (!detail || !destinationKey) return null;
    return buildUpdatePreview({
      context: updateContext,
      destinationKey,
      title: detail.title,
      patch,
      baseline: {
        status: detail.status,
        priority: detail.priority,
        dueDate: detail.dueDate,
        stage: detail.stage,
      },
    });
  }, [detail, destinationKey, patch, updateContext]);

  const beginEdit = () => {
    if (!detail) return;
    setPatch({
      status: detail.status,
      priority: detail.priority,
      dueDate: detail.dueDate,
      stage: detail.stage,
    });
    setStep("edit");
    setResultMessage(null);
  };

  const cancelEdit = () => {
    setStep("view");
    setPatch({});
    setResultMessage(null);
  };

  const goPreview = (event: FormEvent) => {
    event.preventDefault();
    if (!preview) {
      setResultMessage("Choose at least one change before preview.");
      return;
    }
    idempotencyKey.current = crypto.randomUUID();
    setStep("preview");
    setResultMessage(null);
  };

  const authorize = async () => {
    if (!detail || !destinationKey || !preview || executing) return;
    setExecuting(true);
    setResultMessage(null);
    try {
      const sessionResponse = await fetch("/api/os/capture/session", { cache: "no-store" });
      const session = (await sessionResponse.json()) as { ok?: boolean; csrfToken?: string };
      if (!session.ok || !session.csrfToken) throw new Error("Capture session unavailable.");

      const changed: GovernedUpdatePatch = {};
      for (const field of editableFields) {
        const next = patch[field]?.trim();
        const prior = detail[field]?.trim();
        if (next && next !== prior) changed[field] = next;
      }
      if (!Object.keys(changed).length) throw new Error("No changes to authorize.");

      const response = await fetch("/api/os/record-update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Craig-OS-CSRF": session.csrfToken,
        },
        body: JSON.stringify({
          actionId: "RECORD_UPDATE",
          recordId: detail.recordId,
          context: updateContext,
          destinationKey,
          patch: changed,
          baseline: {
            title: detail.title,
            status: detail.status,
            priority: detail.priority,
            dueDate: detail.dueDate,
            stage: detail.stage,
          },
          evidence: "DAVID_DECISION",
          searchedBeforeCreate: true,
          authorized: true,
          idempotencyKey: idempotencyKey.current || crypto.randomUUID(),
          explicitSpiritualSave: updateContext === "spiritual" || explicitSpiritual,
        }),
      });
      const body = (await response.json()) as {
        ok: boolean;
        data?: { title?: string; readBack?: RecordDetail; recordUrl?: string };
        error?: { message?: string };
        errorCode?: string;
      };
      if (!body.ok) throw new Error(body.error?.message ?? body.errorCode ?? "Update failed.");
      if (body.data?.readBack) setDetail(body.data.readBack);
      setResultMessage(`${body.data?.title ?? detail.title} updated.`);
      setStep("success");
      setPatch({});
    } catch (error) {
      setResultMessage(error instanceof Error ? error.message : "Update failed.");
      setStep("failure");
    } finally {
      setExecuting(false);
    }
  };

  if (!open || !record) return null;

  const deepEditUrl = detail?.deepEditUrl ?? record.notionUrl;
  const identityTitle = detail?.title ?? record.title;
  const identityKind = detail?.recordType ?? record.kind;

  return (
    <div
      className="p15-inspect-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !executing) onClose();
      }}
    >
      <aside
        ref={panelRef}
        className={narrow ? "p15-sheet p15-record-drawer" : "p15-drawer p15-record-drawer"}
        role="dialog"
        aria-modal="true"
        aria-label={`${identityKind} detail`}
        data-record-drawer="true"
      >
        <header>
          <div>
            <p className="p15-eyebrow">{identityKind}</p>
            <h2>{identityTitle}</h2>
            <p>
              {detail?.context ?? record.context} · {contextLabel}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close detail" disabled={executing}>
            Close
          </button>
        </header>

        {loading ? (
          <section className="p15-record-loading" aria-live="polite">
            <p className="p15-eyebrow">LOADING</p>
            <strong>Opening record…</strong>
          </section>
        ) : null}

        {!loading && loadError ? (
          <section className="p15-record-error" aria-live="assertive">
            <p className="p15-eyebrow">UNAVAILABLE</p>
            <strong>{identityTitle}</strong>
            <p>{loadError}</p>
          </section>
        ) : null}

        {!loading && detail && step === "view" ? (
          <>
            <section>
              <p className="p15-eyebrow">WHAT MATTERS</p>
              <dl className="p15-record-meta">
                {detail.status ? (
                  <div>
                    <dt>Status</dt>
                    <dd>{detail.status}</dd>
                  </div>
                ) : null}
                {detail.priority ? (
                  <div>
                    <dt>Priority</dt>
                    <dd>{detail.priority}</dd>
                  </div>
                ) : null}
                {detail.stage ? (
                  <div>
                    <dt>Stage</dt>
                    <dd>{detail.stage}</dd>
                  </div>
                ) : null}
                {detail.dueDate ? (
                  <div>
                    <dt>Due</dt>
                    <dd>{detail.dueDate}</dd>
                  </div>
                ) : null}
                {!detail.status && !detail.priority && !detail.stage && !detail.dueDate ? (
                  <div>
                    <dt>State</dt>
                    <dd>{record.status ?? "Available for review"}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {detail.relationships.length ? (
              <section>
                <p className="p15-eyebrow">RELATIONSHIPS</p>
                <ul className="p15-record-relations">
                  {detail.relationships.map((item) => (
                    <li key={`${item.label}-${item.recordId ?? item.title}`}>
                      <span>{item.label}</span>
                      <strong>{item.title ?? item.recordId ?? "Linked"}</strong>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detail.summary ? (
              <section>
                <p className="p15-eyebrow">CONTEXT</p>
                <p className="p15-record-summary">{detail.summary}</p>
              </section>
            ) : null}

            <footer className="p15-record-actions">
              <button type="button" onClick={onClose}>
                Back to {contextLabel}
              </button>
              {detail.allowedActions.quickEdit ? (
                <button type="button" className="p15-ask-primary" onClick={beginEdit} data-record-edit="true">
                  Governed edit
                </button>
              ) : null}
              <DeepEditLink href={deepEditUrl} label="Open in Notion" />
            </footer>
          </>
        ) : null}

        {!loading && detail && step === "edit" ? (
          <form className="p15-record-edit" onSubmit={goPreview}>
            <p className="p15-eyebrow">GOVERNED EDIT</p>
            <p className="p15-record-guidance">Change only what matters. Nothing writes until you authorize.</p>
            {editableFields.includes("status") ? (
              <label className="p15-ask-field" htmlFor={statusId}>
                <span>Status</span>
                <input
                  id={statusId}
                  value={patch.status ?? ""}
                  onChange={(event) => setPatch((prev) => ({ ...prev, status: event.target.value }))}
                />
              </label>
            ) : null}
            {editableFields.includes("priority") ? (
              <label className="p15-ask-field" htmlFor={priorityId}>
                <span>Priority</span>
                <input
                  id={priorityId}
                  value={patch.priority ?? ""}
                  onChange={(event) => setPatch((prev) => ({ ...prev, priority: event.target.value }))}
                />
              </label>
            ) : null}
            {editableFields.includes("dueDate") ? (
              <label className="p15-ask-field" htmlFor={dueId}>
                <span>Due date</span>
                <input
                  id={dueId}
                  type="date"
                  value={patch.dueDate ?? ""}
                  onChange={(event) => setPatch((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
              </label>
            ) : null}
            {editableFields.includes("stage") ? (
              <label className="p15-ask-field" htmlFor={stageId}>
                <span>Stage</span>
                <input
                  id={stageId}
                  value={patch.stage ?? ""}
                  onChange={(event) => setPatch((prev) => ({ ...prev, stage: event.target.value }))}
                />
              </label>
            ) : null}
            {resultMessage ? <p className="p15-ask-error">{resultMessage}</p> : null}
            <footer className="p15-record-actions">
              <button type="button" onClick={cancelEdit}>
                Cancel
              </button>
              <button type="submit" className="p15-ask-primary">
                Preview change
              </button>
            </footer>
          </form>
        ) : null}

        {!loading && detail && step === "preview" && preview ? (
          <section className="p15-record-preview" aria-live="polite">
            <p className="p15-eyebrow">AUTHORIZE UPDATE</p>
            <strong>{preview.title}</strong>
            <p className="p15-record-guidance">
              {preview.destinationLabel} · {preview.sensitivity}
            </p>
            <ul className="p15-record-relations">
              {preview.fields.map((field) => (
                <li key={field.label}>
                  <span>{field.label}</span>
                  <strong>{field.value}</strong>
                </li>
              ))}
            </ul>
            <footer className="p15-record-actions">
              <button type="button" onClick={() => setStep("edit")} disabled={executing}>
                Back
              </button>
              <button type="button" className="p15-ask-primary" onClick={() => void authorize()} disabled={executing} data-record-authorize="true">
                {executing ? "Saving…" : "Authorize update"}
              </button>
            </footer>
          </section>
        ) : null}

        {!loading && (step === "success" || step === "failure") ? (
          <section aria-live="polite">
            <p className="p15-eyebrow">{step === "success" ? "UPDATED" : "FAILED"}</p>
            <strong>{resultMessage}</strong>
            <footer className="p15-record-actions">
              <button type="button" onClick={() => setStep("view")}>
                Back to detail
              </button>
              <DeepEditLink href={deepEditUrl} label="Open in Notion" />
            </footer>
          </section>
        ) : null}

        {!loading && !detail && !loadError ? (
          <footer className="p15-record-actions">
            <button type="button" onClick={onClose}>
              Back to {contextLabel}
            </button>
            <DeepEditLink href={deepEditUrl} label="Open in Notion" />
          </footer>
        ) : null}
      </aside>
    </div>
  );
}
