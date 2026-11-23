"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { reportLead } from "@/components/report-lead";
import { ROLES, VOLUMES } from "@/lib/chat";

type Line = { role: "user" | "assistant" | "human"; content: string; id?: string };

const OFFLINE = "The assistant is offline right now. Use the request form, or email sales@trafficlight.gg.";
const STARTERS = ["How does a deal work?", "What does an affiliate get?", "How is a deposit reviewed?", "I want a desk"];

export function ChatWidget() {
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Line[]>([]);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [session, setSession] = useState("");
  const [live, setLive] = useState(false);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    openRef.current = open;
    if (open) setUnread(false);
  }, [open]);

  useEffect(() => {
    let id = "";
    try {
      const saved = sessionStorage.getItem("tl-chat-session") || "";
      id = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved) ? saved : crypto.randomUUID();
      sessionStorage.setItem("tl-chat-session", id);
      if (sessionStorage.getItem("tl-chat-live") === "1") setLive(true);
    } catch {
      id = crypto.randomUUID();
    }
    setSession(id);
  }, []);

  useEffect(() => {
    if (!live || !session) return;
    let stop = false;
    async function pull() {
      try {
        const response = await fetch(`/api/chat/live?session=${session}`);
        const data = (await response.json().catch(() => null)) as { messages?: { id?: string; content?: string }[] } | null;
        const incoming = data && Array.isArray(data.messages) ? data.messages : [];
        const have = new Set(linesRef.current.map((line) => line.id).filter(Boolean));
        const fresh = incoming.filter((item) => item.id && item.content && !have.has(item.id));
        if (!fresh.length || stop) return;
        const next = [
          ...linesRef.current,
          ...fresh.map((item) => ({ role: "human" as const, content: String(item.content), id: String(item.id) })),
        ].slice(-24);
        linesRef.current = next;
        setLines(next);
        if (!openRef.current) setUnread(true);
      } catch {
        // The next poll tries again.
      }
    }
    void pull();
    const timer = window.setInterval(() => void pull(), 4000);
    return () => {
      stop = true;
      window.clearInterval(timer);
    };
  }, [live, session]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [lines, pending, open]);

  async function send(text: string) {
    const content = text.replace(/\s+/g, " ").trim();
    if (!content || pending) return;
    const history = [...linesRef.current, { role: "user" as const, content }].slice(-12);
    linesRef.current = history;
    setLines(history);
    setDraft("");
    setPending(true);
    setLive(true);
    try {
      sessionStorage.setItem("tl-chat-live", "1");
    } catch {
      // The reply still works for this page view.
    }
    try {
      let ad: unknown;
      try {
        const saved = sessionStorage.getItem("tl-ad");
        if (saved) ad = JSON.parse(saved);
      } catch {
        ad = undefined;
      }
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: history.map((line) => ({ role: line.role, content: line.content })),
          path: window.location.pathname,
          ad,
          session,
        }),
      });
      const data = (await response.json().catch(() => null)) as { reply?: string; saved?: boolean; email?: string } | null;
      const reply = data && typeof data.reply === "string" && data.reply ? data.reply : OFFLINE;
      const next = [...linesRef.current, { role: "assistant" as const, content: reply }].slice(-24);
      linesRef.current = next;
      setLines(next);
      if (data?.saved && data.email) reportLead(data.email);
    } catch {
      const next = [...linesRef.current, { role: "assistant" as const, content: OFFLINE }].slice(-24);
      linesRef.current = next;
      setLines(next);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft;
    setDraft("");
    void send(content);
  }

  const choices = pending ? [] : choicesFor(lines);
  const person = lines.some((line) => line.role === "human");

  return (
    <div className="chat-dock">
      {open ? (
        <section className="chat-panel" role="dialog" aria-labelledby={titleId}>
          <header className="chat-head">
            <div>
              <p id={titleId}>Ask about the desk</p>
              <span>{person ? "A person from TrafficLight is in this chat." : "Answers come from the public pages."}</span>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              Close
            </button>
          </header>
          <div className="chat-log" ref={logRef}>
            {lines.length === 0 ? (
              <p className="chat-hello">Ask how the desk works.</p>
            ) : null}
            {lines.map((line, index) => (
              <p key={line.id || `${line.role}-${index}`} className={line.role === "user" ? "chat-user" : line.role === "human" ? "chat-human" : "chat-assistant"}>
                {line.role === "human" ? <small>TrafficLight</small> : null}
                {line.content}
              </p>
            ))}
            {pending ? <p className="chat-assistant">One moment.</p> : null}
          </div>
          {choices.length > 0 ? (
            <div className="chat-choices">
              {choices.map((choice) => (
                <button key={choice} type="button" onClick={() => void send(choice)}>
                  {choice}
                </button>
              ))}
            </div>
          ) : null}
          <form className="chat-form" onSubmit={onSubmit}>
            <label className="sr" htmlFor={`${titleId}-input`}>
              Message
            </label>
            <textarea
              id={`${titleId}-input`}
              ref={inputRef}
              rows={2}
              maxLength={800}
              value={draft}
              placeholder="Ask a question"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button type="submit" disabled={pending || draft.trim().length === 0}>
              Send
            </button>
          </form>
          <p className="chat-form-link">
            <a href="/request">Request a desk</a>
          </p>
        </section>
      ) : null}
      <button type="button" className="chat-toggle" aria-expanded={open} aria-label={open ? "Close chat" : unread ? "Ask, new reply" : "Ask"} onClick={() => setOpen((value) => !value)}>
        <span className="chat-toggle-icon">{open ? <CloseMark /> : <ChatMark />}</span>
        <span>{open ? "Close" : "Ask"}</span>
        {unread && !open ? <span className="chat-unread" /> : null}
      </button>
    </div>
  );
}

function choicesFor(lines: Line[]) {
  if (lines.length === 0) return STARTERS;
  const last = [...lines].reverse().find((line) => line.role === "assistant");
  if (!last) return [];
  const text = last.content.toLowerCase();
  if (/\brole\b/.test(text)) return [...ROLES];
  if (text.includes("volume") || text.includes("leads a month")) return [...VOLUMES];
  return [];
}

function ChatMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M7.2 3h9.6A2.4 2.4 0 0 1 19.2 5.4v8.2a2.4 2.4 0 0 1-2.4 2.4h-5.1l-4.3 3.7a.7.7 0 0 1-1.1-.6v-3.1H7.2a2.4 2.4 0 0 1-2.4-2.4V5.4A2.4 2.4 0 0 1 7.2 3Zm1.6 7.3a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Zm3.2 0a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Zm3.2 0a1.15 1.15 0 1 0 0-2.3 1.15 1.15 0 0 0 0 2.3Z"
      />
    </svg>
  );
}

function CloseMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
