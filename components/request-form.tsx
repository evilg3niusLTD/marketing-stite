"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useId, useState } from "react";
import { reportLead } from "@/components/report-lead";
import { parseDeskRequest, ROLES, VOLUMES, type RequestErrors } from "@/lib/request";
import { CONTACT_EMAIL } from "@/lib/site";

type Field = keyof RequestErrors;

export function RequestForm() {
  const baseId = useId();
  const [errors, setErrors] = useState<RequestErrors>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = parseDeskRequest({
      email: data.get("email"),
      telegram: data.get("telegram"),
      role: data.get("role"),
      countries: data.get("countries"),
      volume: data.get("volume"),
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setSaved(false);
      setFailed(false);
      return;
    }
    setErrors({});
    setPending(true);
    setFailed(false);
    try {
      let ad: unknown;
      try {
        const saved = sessionStorage.getItem("tl-ad");
        if (saved) ad = JSON.parse(saved);
      } catch {
        ad = undefined;
      }
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...parsed.value, ad }),
      });
      if (!response.ok) throw new Error("save failed");
      setSaved(true);
      reportLead(parsed.value.email);
    } catch {
      setSaved(false);
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  function field(name: Field, label: string, control: ReactNode, wide = false) {
    const error = errors[name];
    const errorId = `${baseId}-${name}-error`;
    const className = ["field", wide ? "field-wide" : "", error ? "invalid" : ""].filter(Boolean).join(" ");
    return (
      <label className={className}>
        <span>{label}</span>
        {control}
        {error ? (
          <small id={errorId} role="alert">
            {error}
          </small>
        ) : null}
      </label>
    );
  }

  return (
    <form className="request-form" onSubmit={onSubmit} noValidate>
      {field("email", "Work email", <input name="email" type="email" required autoComplete="email" aria-invalid={Boolean(errors.email)} />)}
      {field(
        "telegram",
        "Telegram",
        <input name="telegram" type="text" required autoComplete="off" placeholder="@username" aria-invalid={Boolean(errors.telegram)} />,
      )}
      {field(
        "role",
        "Your side of the desk",
        <select name="role" defaultValue="" required aria-invalid={Boolean(errors.role)}>
          <option value="" disabled>
            Select one
          </option>
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>,
      )}
      {field(
        "volume",
        "Lead volume",
        <select name="volume" defaultValue="" required aria-invalid={Boolean(errors.volume)}>
          <option value="" disabled>
            Select one
          </option>
          {VOLUMES.map((volume) => (
            <option key={volume}>{volume}</option>
          ))}
        </select>,
        true,
      )}
      {field(
        "countries",
        "Countries",
        <input name="countries" type="text" required placeholder="GB, DE" aria-invalid={Boolean(errors.countries)} />,
        true,
      )}
      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending || saved}>
          {pending ? "Sending…" : saved ? "Request saved" : "Send request"}
        </button>
        <p>
          Every field is required. We save the request on this site.{" "}
          <Link href="/privacy">Privacy policy</Link>
        </p>
      </div>
      {saved ? (
        <p className="form-status" role="status">
          Saved. We will reply by email or Telegram.
        </p>
      ) : null}
      {failed ? (
        <p className="form-status" role="alert">
          We could not save that. Email {CONTACT_EMAIL} and we will reply from there.
        </p>
      ) : null}
    </form>
  );
}
