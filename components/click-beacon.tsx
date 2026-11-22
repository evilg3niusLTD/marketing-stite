"use client";

import { useEffect } from "react";

function clickId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function ClickBeacon() {
  useEffect(() => {
    try {
      recordVisit();
    } catch {
      /* a tracking failure must not blank the page */
    }
  }, []);
  return null;
}

function recordVisit() {
  const params = new URLSearchParams(window.location.search);
  const picked: Record<string, string> = {};
  for (const [name, value] of params) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,40}$/.test(name) || !value) continue;
    picked[name] = value.slice(0, 180);
  }
  if (Object.keys(picked).length > 0) {
    try {
      window.sessionStorage.setItem("tl-ad", JSON.stringify(picked));
    } catch {
      /* the click is still posted */
    }
  }
  const adId = picked.gclid || picked.gbraid || picked.wbraid;
  let seenAds = "";
  let seenVisit = "";
  let carriedAd = "";
  try {
    seenAds = window.localStorage.getItem("tl-ad-clicks") || "";
    seenVisit = window.sessionStorage.getItem("tl-visit") || "";
    carriedAd = window.sessionStorage.getItem("tl-ad") || "";
  } catch {
    seenAds = "";
  }
  if ((adId && seenAds.split(" ").includes(adId)) || (!adId && (seenVisit || carriedAd))) return;
  const id = clickId();
  try {
    if (adId) window.localStorage.setItem("tl-ad-clicks", `${seenAds} ${adId}`.trim().slice(-2000));
    else window.sessionStorage.setItem("tl-visit", id);
  } catch {
    /* the server still stores the click */
  }
  fetch("/api/click", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id, path: window.location.pathname, referrer: document.referrer, params: picked }),
    keepalive: true,
  }).catch(() => undefined);
}
