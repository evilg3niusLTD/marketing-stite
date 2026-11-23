"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";

type Line = { role: "user" | "assistant" | "human"; content: string; id?: string };

const WELCOME = "Hi, welcome to TrafficLight. Tell us what you need and a person from the team will reply here.";
const WAITING = "Thanks. We'll reply here shortly.";
const PAUSED = "The chat is paused for today. Email sales@trafficlight.gg and we will reply from there.";
const FAILED = "We could not send that. Email sales@trafficlight.gg and we will reply from there.";

export function ChatWidget() {
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<Line[]>([{ role: "human", content: WELCOME }]);
  const openRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<Line[]>(linesRef.current);
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

  function show(next: Line[]) {
    linesRef.current = next;
    setLines(next);
  }

  async function send(text: string) {
    const content = text.replace(/\s+/g, " ").trim();
    if (!content || pending) return;
    const history = [...linesRef.current, { role: "user" as const, content }].slice(-24);
    show(history);
    setDraft("");
    setPending(true);
    setLive(true);
    try {
      sessionStorage.setItem("tl-chat-live", "1");
    } catch {
      // The reply still works for this page view.
    }
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content }],
          path: window.location.pathname,
          session,
        }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; paused?: boolean } | null;
      if (!response.ok || !data?.ok) throw new Error("send failed");
      const note = data.paused ? PAUSED : WAITING;
      if (linesRef.current.some((line) => line.content === note)) return;
      show([...linesRef.current, { role: "human" as const, content: note }].slice(-24));
    } catch {
      show([...linesRef.current, { role: "human" as const, content: FAILED }].slice(-24));
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

  return (
    <div className="chat-dock">
      {open ? (
        <section className="chat-panel" role="dialog" aria-labelledby={titleId}>
          <header className="chat-head">
            <div>
              <p id={titleId}>Live chat</p>
              <span>A person from TrafficLight replies here.</span>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              Close
            </button>
          </header>
          <div className="chat-log" ref={logRef}>
            {lines.map((line, index) => (
              <p key={line.id || `${line.role}-${index}`} className={line.role === "user" ? "chat-user" : "chat-human"}>
                {line.role === "human" ? <small>TrafficLight</small> : null}
                {line.content}
              </p>
            ))}
          </div>
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
              placeholder="Write a message"
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button type="submit" disabled={pending || draft.trim().length === 0}>
              {pending ? "Sending…" : "Send"}
            </button>
          </form>
        </section>
      ) : null}
      <button type="button" className="chat-toggle" aria-expanded={open} aria-label={open ? "Close chat" : unread ? "Chat, new reply" : "Chat"} onClick={() => setOpen((value) => !value)}>
        <span className="chat-toggle-icon">{open ? <CloseMark /> : <ChatMark />}</span>
        <span>{open ? "Close" : "Chat"}</span>
        {unread && !open ? <span className="chat-unread" /> : null}
      </button>
    </div>
  );
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
