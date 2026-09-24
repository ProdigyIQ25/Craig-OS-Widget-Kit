"use client";

import { type FormEvent, useCallback, useEffect, useId, useRef, useState } from "react";
import type { AskActionProposal, AskCitation, AskResponse, AskSurfaceContext } from "@/lib/phase15/ask";
import { CaptureCommand, type CaptureSeed } from "./capture-command";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  citations?: AskCitation[];
  proposal?: AskActionProposal | null;
  errorCode?: string | null;
};

function defaultSurfaceLabel(surface: AskSurfaceContext): string {
  if (surface === "business") return "Business";
  if (surface === "spiritual") return "Spiritual";
  if (surface === "personal") return "Personal";
  return "Operating";
}

export function AskCommand({ surface }: { surface: AskSurfaceContext }) {
  const dialogTitleId = useId();
  const inputId = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [seed, setSeed] = useState<CaptureSeed | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const close = () => {
    if (busy) return;
    setOpen(false);
    setError(null);
  };

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
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
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  const clearSeed = useCallback(() => setSeed(null), []);

  const authorizeProposal = (proposal: AskActionProposal) => {
    setSeed({
      context: proposal.context,
      destinationKey: proposal.destinationKey,
      title: proposal.title,
      explicitSpiritualSave: proposal.explicitSpiritualSave,
      startAtPreview: true,
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = message.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    setMessage("");
    const userId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: userId, role: "user", text }]);

    try {
      const response = await fetch("/api/os/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, surface }),
      });
      const body = (await response.json()) as {
        ok: boolean;
        data?: AskResponse;
        error?: { message?: string; code?: string };
        errorCode?: string;
      };
      const data = body.data;
      if (!data) {
        throw new Error(body.error?.message ?? body.errorCode ?? "Ask failed.");
      }
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.answer,
          citations: data.citations,
          proposal: data.proposal,
          errorCode: data.errorCode,
        },
      ]);
      if (!body.ok && data.errorCode === "RETRIEVAL_UNAVAILABLE") {
        setError(data.answer);
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Ask failed.";
      setError(detail);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "system", text: detail },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="p15-ask-trigger"
        data-ask-entry="true"
        onClick={() => setOpen(true)}
      >
        Ask Craig OS
      </button>

      <CaptureCommand surface={surface === "home" ? "home" : surface} seed={seed} onSeedConsumed={clearSeed} hideTrigger />

      {open ? (
        <div
          className="p15-ask-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <section
            className="p15-ask-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            data-ask-surface={surface}
          >
            <header className="p15-ask-head">
              <div>
                <p className="p15-eyebrow">Ask Craig OS</p>
                <h2 id={dialogTitleId}>{defaultSurfaceLabel(surface)} intelligence</h2>
              </div>
              <button type="button" className="p15-ask-close" onClick={close} aria-label="Close Ask Craig OS">
                Close
              </button>
            </header>

            <p className="p15-ask-guidance">
              Answers are grounded in Craig OS records. Creates become Capture proposals — nothing writes until you authorize.
            </p>

            <div className="p15-ask-thread" ref={listRef} aria-live="polite" aria-relevant="additions">
              {messages.length === 0 ? (
                <div className="p15-ask-empty">
                  <p>Ask what requires attention, what is due, or prepare a capture.</p>
                  <ul>
                    <li>What requires my attention?</li>
                    <li>What personal tasks are due?</li>
                    <li>Create a business task to follow up Friday</li>
                  </ul>
                </div>
              ) : null}
              {messages.map((item) => (
                <article key={item.id} className={`p15-ask-message p15-ask-message-${item.role}`} data-role={item.role}>
                  <p className="p15-ask-role">{item.role === "user" ? "You" : item.role === "system" ? "System" : "Craig OS"}</p>
                  <div className="p15-ask-body">{item.text}</div>
                  {item.citations && item.citations.length ? (
                    <ul className="p15-ask-citations">
                      {item.citations.map((citation) => (
                        <li key={citation.recordId}>
                          <a href={citation.notionUrl} target="_blank" rel="noreferrer">
                            {citation.title}
                          </a>
                          <span>{citation.sourceLabel}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {item.proposal ? (
                    <div className="p15-ask-proposal" data-authorization-state={item.proposal.authorizationState}>
                      <p className="p15-eyebrow">Proposed action</p>
                      <strong>{item.proposal.destinationLabel}</strong>
                      <p>{item.proposal.title}</p>
                      <p className="p15-ask-proposal-meta">
                        {item.proposal.context} · {item.proposal.authorizationState.replaceAll("_", " ").toLowerCase()}
                      </p>
                      <p className="p15-ask-proposal-rationale">{item.proposal.rationale}</p>
                      <div className="p15-ask-actions">
                        <button
                          type="button"
                          className="p15-ask-primary"
                          onClick={() => authorizeProposal(item.proposal!)}
                        >
                          Review &amp; authorize in Capture
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              ))}
              {busy ? <p className="p15-ask-thinking">Retrieving and reasoning…</p> : null}
            </div>

            {error ? <p className="p15-ask-error" role="alert">{error}</p> : null}

            <form className="p15-ask-composer" onSubmit={submit}>
              <label className="p15-ask-field" htmlFor={inputId}>
                <span>Message</span>
                <textarea
                  id={inputId}
                  ref={inputRef}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={3}
                  placeholder="Ask about your operating context…"
                  disabled={busy}
                />
              </label>
              <div className="p15-ask-actions">
                <button type="button" onClick={close} disabled={busy}>
                  Close
                </button>
                <button type="submit" className="p15-ask-primary" disabled={busy || !message.trim()}>
                  {busy ? "Working…" : "Ask"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
