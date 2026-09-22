"use client";

import {
  type FormEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildMutationPreview,
  businessCaptureTargets,
  type CaptureContext,
  type CaptureDestinationKey,
  type GovernedCapturePayload,
  personalCaptureTargets,
  spiritualCaptureTargets,
  validateCapturePayload,
} from "@/lib/phase15/governed-action";

type CaptureStep = "compose" | "preview" | "success" | "failure";

type CaptureResult = {
  destinationLabel: string;
  title: string;
  recordUrl?: string;
  message?: string;
};

const CONTEXT_LABEL: Record<CaptureContext, string> = {
  personal: "Personal",
  business: "Business",
  spiritual: "Spiritual",
};

function defaultContext(from: "home" | "personal" | "business" | "spiritual"): CaptureContext {
  if (from === "business") return "business";
  if (from === "spiritual") return "spiritual";
  return "personal";
}

export function CaptureCommand({
  surface,
}: {
  surface: "home" | "personal" | "business" | "spiritual";
}) {
  const titleId = useId();
  const dialogTitleId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<CaptureStep>("compose");
  const [context, setContext] = useState<CaptureContext>(defaultContext(surface));
  const [destinationKey, setDestinationKey] = useState<CaptureDestinationKey | "">("");
  const [payload, setPayload] = useState<GovernedCapturePayload>({ title: "" });
  const [explicitSpiritualSave, setExplicitSpiritualSave] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<CaptureResult | null>(null);
  const idempotencyKey = useRef("");
  const titleRef = useRef<HTMLInputElement | null>(null);
  const locked = useRef(false);

  const destinations = useMemo(() => {
    if (context === "business") return businessCaptureTargets();
    if (context === "spiritual") return spiritualCaptureTargets();
    return personalCaptureTargets();
  }, [context]);

  const preview = useMemo(() => {
    if (!destinationKey || !payload.title.trim()) return null;
    return buildMutationPreview({
      context,
      destinationKey,
      payload,
    });
  }, [context, destinationKey, payload]);

  const reset = () => {
    setStep("compose");
    setContext(defaultContext(surface));
    setDestinationKey("");
    setPayload({ title: "" });
    setExplicitSpiritualSave(false);
    setValidationMessage(null);
    setExecuting(false);
    setResult(null);
    locked.current = false;
    idempotencyKey.current = crypto.randomUUID();
  };

  const close = () => {
    if (executing) return;
    setOpen(false);
    reset();
  };

  useEffect(() => {
    if (!open) return;
    idempotencyKey.current = crypto.randomUUID();
    const timer = window.setTimeout(() => titleRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!destinations.some((item) => item.key === destinationKey)) {
      setDestinationKey("");
    }
  }, [destinations, destinationKey]);

  const goPreview = (event: FormEvent) => {
    event.preventDefault();
    if (!destinationKey) {
      setValidationMessage("Choose where this belongs.");
      return;
    }
    const validation = validateCapturePayload({
      context,
      destinationKey,
      payload,
      explicitSpiritualSave: context === "spiritual" ? explicitSpiritualSave : undefined,
    });
    if (!validation.ok) {
      setValidationMessage(validation.message);
      return;
    }
    setValidationMessage(null);
    setStep("preview");
  };

  const authorizeAndSave = async () => {
    if (!destinationKey || executing || locked.current) return;
    locked.current = true;
    setExecuting(true);
    setValidationMessage(null);
    try {
      const sessionResponse = await fetch("/api/os/capture/session", { cache: "no-store" });
      const session = (await sessionResponse.json()) as { ok: boolean; csrfToken?: string; errorCode?: string };
      if (!sessionResponse.ok || !session.ok || !session.csrfToken) {
        throw new Error(session.errorCode ?? "UPSTREAM_UNAVAILABLE");
      }

      const response = await fetch("/api/os/capture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Craig-OS-CSRF": session.csrfToken,
          "X-Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          actionId: "CAPTURE_CREATE",
          context,
          destinationKey,
          payload,
          evidence: "DAVID_DECISION",
          searchedBeforeCreate: true,
          authorized: true,
          idempotencyKey: idempotencyKey.current,
          explicitSpiritualSave: context === "spiritual" ? explicitSpiritualSave : false,
        }),
      });
      const body = (await response.json()) as {
        ok: boolean;
        data?: { destinationLabel: string; title: string; recordUrl?: string };
        error?: { code: string; message: string };
        errorCode?: string;
      };
      if (!response.ok || !body.ok || !body.data) {
        throw new Error(body.error?.message ?? body.errorCode ?? "WRITE_FAILED");
      }
      setResult({
        destinationLabel: body.data.destinationLabel,
        title: body.data.title,
        recordUrl: body.data.recordUrl,
      });
      setStep("success");
    } catch (error) {
      locked.current = false;
      setResult({
        destinationLabel: preview?.destinationLabel ?? "Capture",
        title: payload.title.trim(),
        message: error instanceof Error ? error.message : "Could not capture this record. Nothing was saved.",
      });
      setStep("failure");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="p15-capture-trigger"
        data-capture-entry="true"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        Capture
      </button>

      {open ? (
        <div
          className="p15-capture-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            className="p15-capture-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            data-capture-step={step}
            data-capture-context={context}
          >
            <header className="p15-capture-head">
              <div>
                <p className="p15-eyebrow">Governed capture</p>
                <h2 id={dialogTitleId}>
                  {step === "success"
                    ? "Captured"
                    : step === "failure"
                      ? "Not saved"
                      : step === "preview"
                        ? "Authorize write"
                        : "Capture"}
                </h2>
              </div>
              <button
                type="button"
                className="p15-capture-close"
                aria-label="Close capture"
                onClick={close}
                disabled={executing}
              >
                ×
              </button>
            </header>

            {step === "compose" ? (
              <form className="p15-capture-form" onSubmit={goPreview}>
                <p className="p15-capture-guidance">
                  Name what you are capturing, choose where it belongs, then authorize the write.
                </p>

                <fieldset className="p15-capture-context">
                  <legend>Context</legend>
                  {(["personal", "business", "spiritual"] as const).map((value) => (
                    <label key={value}>
                      <input
                        type="radio"
                        name="capture-context"
                        value={value}
                        checked={context === value}
                        onChange={() => {
                          setContext(value);
                          setExplicitSpiritualSave(false);
                          setValidationMessage(null);
                        }}
                      />
                      <span>{CONTEXT_LABEL[value]}</span>
                    </label>
                  ))}
                </fieldset>

                <label className="p15-capture-field">
                  <span>Destination</span>
                  <select
                    value={destinationKey}
                    required
                    aria-invalid={Boolean(validationMessage && !destinationKey)}
                    onChange={(event) => {
                      setDestinationKey(event.target.value as CaptureDestinationKey);
                      setValidationMessage(null);
                    }}
                  >
                    <option value="">Choose destination…</option>
                    {destinations.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                {context === "spiritual" ? (
                  <label className="p15-capture-check">
                    <input
                      type="checkbox"
                      checked={explicitSpiritualSave}
                      onChange={(event) => setExplicitSpiritualSave(event.target.checked)}
                    />
                    <span>I explicitly intend to save into this spiritual store.</span>
                  </label>
                ) : null}

                <label className="p15-capture-field" htmlFor={titleId}>
                  <span>Title</span>
                  <input
                    id={titleId}
                    ref={titleRef}
                    value={payload.title}
                    maxLength={200}
                    required
                    aria-invalid={Boolean(validationMessage && !payload.title.trim())}
                    aria-describedby={validationMessage ? "capture-validation" : undefined}
                    placeholder="What should Craig OS remember?"
                    onChange={(event) => setPayload((current) => ({ ...current, title: event.target.value }))}
                  />
                </label>

                <label className="p15-capture-field">
                  <span>Detail <em>Optional</em></span>
                  <textarea
                    value={payload.summary ?? ""}
                    maxLength={1000}
                    rows={3}
                    placeholder="Only what matters for the first write."
                    onChange={(event) =>
                      setPayload((current) => ({ ...current, summary: event.target.value }))
                    }
                  />
                </label>

                {validationMessage ? (
                  <p id="capture-validation" className="p15-capture-error" role="alert">
                    {validationMessage}
                  </p>
                ) : null}

                <div className="p15-capture-actions">
                  <button type="button" onClick={close}>
                    Cancel
                  </button>
                  <button type="submit" className="p15-capture-primary">
                    Review mutation
                  </button>
                </div>
              </form>
            ) : null}

            {step === "preview" && preview ? (
              <div className="p15-capture-preview">
                <p className="p15-capture-guidance">
                  Confirm what Craig OS will create. Nothing is written until you authorize save.
                </p>
                <dl>
                  <div>
                    <dt>Destination</dt>
                    <dd>{preview.destinationLabel}</dd>
                  </div>
                  <div>
                    <dt>Context</dt>
                    <dd>{CONTEXT_LABEL[preview.context]}</dd>
                  </div>
                  <div>
                    <dt>Record type</dt>
                    <dd>{preview.recordType}</dd>
                  </div>
                  <div>
                    <dt>Title</dt>
                    <dd>{preview.title}</dd>
                  </div>
                </dl>
                <ul className="p15-capture-fields">
                  {preview.fields.map((field) => (
                    <li key={`${field.label}-${field.value}`}>
                      <strong>{field.label}</strong>
                      <span>{field.value}</span>
                      <em>{field.source === "system" ? "System" : "You"}</em>
                    </li>
                  ))}
                </ul>
                {preview.relationships.length ? (
                  <p className="p15-muted">Relations: {preview.relationships.join(" · ")}</p>
                ) : (
                  <p className="p15-muted">No relationships will be created.</p>
                )}
                {preview.sensitivity === "spiritual" ? (
                  <p className="p15-capture-sensitive" role="status">
                    Sensitive spiritual destination — explicit intent required.
                  </p>
                ) : null}
                <div className="p15-capture-actions">
                  <button type="button" onClick={() => setStep("compose")} disabled={executing}>
                    Back
                  </button>
                  <button type="button" onClick={close} disabled={executing}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="p15-capture-primary"
                    data-capture-authorize="true"
                    onClick={authorizeAndSave}
                    disabled={executing}
                    aria-busy={executing}
                  >
                    {executing ? "Saving…" : "Confirm & Save"}
                  </button>
                </div>
              </div>
            ) : null}

            {step === "success" && result ? (
              <div className="p15-capture-result" role="status" data-capture-result="success">
                <h3>Created in {result.destinationLabel}</h3>
                <p>{result.title}</p>
                <div className="p15-capture-actions">
                  <button type="button" onClick={close}>
                    Close
                  </button>
                  {result.recordUrl ? (
                    <a href={result.recordUrl} target="_blank" rel="noreferrer">
                      Open record ↗
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}

            {step === "failure" && result ? (
              <div className="p15-capture-result" role="alert" data-capture-result="failure">
                <h3>Mutation did not complete</h3>
                <p>{result.message ?? "Nothing was saved."}</p>
                <p className="p15-muted">Your draft is still available. Retry only creates one intentional record.</p>
                <div className="p15-capture-actions">
                  <button type="button" onClick={close}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="p15-capture-primary"
                    onClick={() => {
                      locked.current = false;
                      setStep("preview");
                    }}
                  >
                    Retry authorize
                  </button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
