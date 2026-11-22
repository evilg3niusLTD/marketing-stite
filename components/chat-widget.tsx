"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { reportLead } from "@/components/report-lead";

type Line = { role: "user" | "assistant"; content: string };

const OFFLINE = "The assistant is offline right now. Use the request form, or email sales@trafficlight.gg.";

export function ChatWidget() {
  const titleId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = draft.replace(/\s+/g, " ").trim();
    if (!content || pending) return;
    const history = [...lines, { role: "user" as const, content }].slice(-12);
    setLines(history);
    setDraft("");
    setPending(true);
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
        body: JSON.stringify({ messages: history, path: window.location.pathname, ad }),
      });
      const data = (await response.json().catch(() => null)) as { reply?: string; saved?: boolean; email?: string } | null;
      const reply = data && typeof data.reply === "string" && data.reply ? data.reply : OFFLINE;
      setLines((current) => [...current, { role: "assistant" as const, content: reply }].slice(-12));
      if (data?.saved && data.email) reportLead(data.email);
    } catch {
      setLines((current) => [...current, { role: "assistant", content: OFFLINE }]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="chat-dock">
      {open ? (
        <section className="chat-panel" role="dialog" aria-labelledby={titleId}>
          <header className="chat-head">
            <div>
              <p id={titleId}>Ask about the desk</p>
              <span>Answers come from the public pages.</span>
            </div>
            <button type="button" className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              Close
            </button>
          </header>
          <div className="chat-log">
            {lines.length === 0 ? (
              <p className="chat-hello">Ask how the desk works, or leave your email, Telegram, role, countries, and volume.</p>
            ) : null}
            {lines.map((line, index) => (
              <p key={`${line.role}-${index}`} className={line.role === "user" ? "chat-user" : "chat-assistant"}>
                {line.content}
              </p>
            ))}
            {pending ? <p className="chat-assistant">One moment.</p> : null}
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
      <button type="button" className="chat-toggle" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? "Hide chat" : "Ask"}
      </button>
    </div>
  );
}
