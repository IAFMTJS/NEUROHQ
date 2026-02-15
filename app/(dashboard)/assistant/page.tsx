"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createTask } from "@/app/actions/tasks";
import { addManualEvent } from "@/app/actions/calendar";
import { addBudgetEntry } from "@/app/actions/budget";

type SuggestedAction =
  | { type: "add_task"; label: string; payload: { title: string; due_date: string } }
  | { type: "add_expense"; label: string; payload: { amount_cents: number; date: string; category?: string; note?: string } }
  | { type: "add_calendar"; label: string; payload: { title: string; start_at: string; end_at: string; sync_to_google?: boolean } };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  escalationTier?: number;
  identityAlert?: boolean;
  courageFlag?: boolean;
  suggestedActions?: SuggestedAction[];
};

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = searchParams.get("message");
    if (q && typeof q === "string") setInput(decodeURIComponent(q));
  }, [searchParams]);

  useEffect(() => {
    const handler = (e: CustomEvent<{ message: string }>) => {
      if (e.detail?.message) setInput(e.detail.message);
    };
    window.addEventListener("quickadd-fill", handler as EventListener);
    return () => window.removeEventListener("quickadd-fill", handler as EventListener);
  }, []);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setError(null);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 429) {
        setRateLimited(true);
        setError(
          "Je hebt te veel berichten verstuurd. Wacht even en probeer het opnieuw."
        );
        setTimeout(() => setRateLimited(false), 60_000);
        return;
      }

      if (!res.ok) {
        setError(
          data?.error ||
            "Het antwoord kon niet worden geladen. Probeer het opnieuw."
        );
        return;
      }

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response ?? "",
        escalationTier: data.escalationTier,
        identityAlert: data.identityAlert,
        courageFlag: data.courageFlag,
        suggestedActions: data.suggestedActions ?? undefined,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(scrollToBottom, 100);
    } catch {
      setError(
        "Het antwoord kon niet worden geladen. Probeer het opnieuw."
      );
    } finally {
      setLoading(false);
    }
  }, [input, loading, scrollToBottom]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const empty = messages.length === 0;
  const disabled = loading || rateLimited || !input.trim();

  const runSuggestedAction = useCallback(
    async (msgId: string, action: SuggestedAction) => {
      try {
        if (action.type === "add_task") {
          await createTask({ title: action.payload.title, due_date: action.payload.due_date });
        } else if (action.type === "add_expense") {
          await addBudgetEntry({
            amount_cents: action.payload.amount_cents,
            date: action.payload.date,
            category: action.payload.category,
            note: action.payload.note,
          });
        } else if (action.type === "add_calendar") {
          await addManualEvent({
            title: action.payload.title,
            start_at: action.payload.start_at,
            end_at: action.payload.end_at,
            sync_to_google: action.payload.sync_to_google ?? false,
          });
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId ? { ...m, suggestedActions: undefined } : m
          )
        );
      } catch {
        setError("Actie uitvoeren mislukt. Probeer het opnieuw.");
      }
    },
    []
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-[var(--accent-neutral)] bg-[var(--bg-surface)] px-4 py-3">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          Assistant
        </h1>
        <p className="text-xs text-[var(--text-muted)]">
          Gedragsarchitectuur – evidence-based
        </p>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingLeft: "var(--hq-padding-x)", paddingRight: "var(--hq-padding-x)" }}
        role="log"
        aria-label="Gesprek"
      >
        {empty && !loading && (
          <p className="text-sm text-[var(--text-secondary)]">
            Stel een vraag of beschrijf wat je bezighoudt. De assistant
            analyseert op basis van je gegevens en geeft evidence-based
            feedback.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            aria-label={msg.role === "user" ? "Bericht van jou" : "Bericht van assistant"}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "rounded-tr-md bg-[var(--bg-elevated)] border border-[var(--card-border)]"
                  : "rounded-tl-md bg-[var(--bg-surface)] border border-[var(--card-border)]"
              }`}
            >
              <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">
                {msg.content}
              </p>
              {msg.role === "assistant" &&
                msg.escalationTier !== undefined &&
                msg.escalationTier > 1 && (
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    {msg.escalationTier === 2 ? "Patroon" : "Direct"}
                  </p>
                )}
              {msg.role === "assistant" &&
                msg.suggestedActions &&
                msg.suggestedActions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.suggestedActions.map((sa, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => runSuggestedAction(msg.id, sa)}
                        className="rounded-lg border border-[var(--accent-focus)] bg-[var(--bg-primary)] px-3 py-1.5 text-xs text-[var(--accent-focus)] transition hover:bg-[var(--accent-focus)] hover:text-[var(--bg-primary)]"
                      >
                        {sa.label}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-md border border-[var(--card-border)] bg-[var(--bg-surface)] px-4 py-3">
              <p className="text-sm text-[var(--text-muted)]">
                Analyseren…
              </p>
            </div>
          </div>
        )}

        {error && (
          <p className="mt-2 text-sm text-[var(--accent-warning)]" role="alert">
            {error}
          </p>
        )}
      </div>

      <div className="shrink-0 border-t border-[var(--accent-neutral)] bg-[var(--bg-surface)] p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Bericht aan assistant…"
            rows={1}
            maxLength={2000}
            disabled={loading || rateLimited}
            className="min-h-[44px] flex-1 resize-none rounded-xl border border-[var(--accent-neutral)] bg-[var(--bg-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-focus)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-focus)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] disabled:opacity-50"
            aria-label="Bericht aan assistant"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={disabled}
            className="shrink-0 rounded-xl bg-[var(--accent-focus)] px-4 py-3 text-[var(--bg-primary)] transition hover:opacity-90 disabled:opacity-50"
            aria-label="Verstuur bericht"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
