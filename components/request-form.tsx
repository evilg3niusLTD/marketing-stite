"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useId, useState } from "react";
import { reportLead } from "@/components/report-lead";
import { parseDeskDetails, parseDeskStart, ROLES, VOLUMES, type RequestErrors } from "@/lib/request";
import { CONTACT_EMAIL } from "@/lib/site";

type Field = keyof RequestErrors;
type Step = "start" | "details" | "done";

export function RequestForm() {
  const baseId = useId();
  const [step, setStep] = useState<Step>("start");
  const [requestId, setRequestId] = useState("");
  const [errors, setErrors] = useState<RequestErrors>({});
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (step === "start") {
      const parsed = parseDeskStart({ email: data.get("email"), role: data.get("role") });
      if (!parsed.ok) {
        setErrors(parsed.errors);
        setFailed(false);
        return;
      }
      setErrors({});
      setPending(true);
      setFailed(false);
      try {
        const response = await fetch("/api/request", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ step: "start", ...parsed.value, ad: storedAd() }),
        });
        const body = (await response.json().catch(() => null)) as { ok?: boolean; id?: string; errors?: RequestErrors } | null;
        if (!response.ok || !body?.id) {
          if (body?.errors) setErrors(body.errors);
          throw new Error("save failed");
        }
        setRequestId(body.id);
        setStep("details");
        reportLead(parsed.value.email);
      } catch {
        setFailed(true);
      } finally {
        setPending(false);
      }
      return;
    }

    const parsed = parseDeskDetails({
      telegram: data.get("telegram"),
      countries: data.get("countries"),
      volume: data.get("volume"),
    });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      setFailed(false);
      return;
    }
    setErrors({});
    setPending(true);
    setFailed(false);
    try {
      const response = await fetch("/api/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ step: "details", id: requestId, ...parsed.value }),
      });
      if (!response.ok) throw new Error("save failed");
      setStep("done");
    } catch {
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

  if (step === "done") {
    return (
      <p className="form-status" role="status">
        Saved. We will reply by email or Telegram.
      </p>
    );
  }

  return (
    <form className="request-form" onSubmit={onSubmit} noValidate>
      {step === "start" ? (
        <>
          {field("email", "Work email", <input name="email" type="email" required autoComplete="email" aria-invalid={Boolean(errors.email)} />)}
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
            true,
          )}
        </>
      ) : (
        <>
          <p className="form-note">Your request is saved. Add Telegram, countries, and volume if you can.</p>
          {field(
            "telegram",
            "Telegram",
            <input name="telegram" type="text" required autoComplete="off" placeholder="@username" aria-invalid={Boolean(errors.telegram)} />,
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
          )}
          {field(
            "countries",
            "Countries",
            <input name="countries" type="text" required placeholder="GB, DE" aria-invalid={Boolean(errors.countries)} />,
            true,
          )}
        </>
      )}
      <div className="form-actions">
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Sending…" : step === "start" ? "Save request" : "Add details"}
        </button>
        <p>
          {step === "start" ? "Email and role save the request. " : "These details are added to the request you just saved. "}
          <Link href="/privacy">Privacy policy</Link>
        </p>
      </div>
      {failed ? (
        <p className="form-status" role="alert">
          We could not save that. Email {CONTACT_EMAIL} and we will reply from there.
        </p>
      ) : null}
    </form>
  );
}

function storedAd() {
  try {
    const saved = sessionStorage.getItem("tl-ad");
    return saved ? JSON.parse(saved) : undefined;
  } catch {
    return undefined;
  }
}
