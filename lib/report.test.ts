import assert from "node:assert/strict";
import test from "node:test";
import { clickDetail, filterClicks, mediaOf, passwordMatches, summarizeVisits, visitQuery } from "./report.ts";

test("a click is grouped by the media source", () => {
  assert.equal(mediaOf({ gclid: "abc", source: "google" }), "Google");
  assert.equal(mediaOf({ source: "bing", extra: { msclkid: "ms" } }), "Bing");
  assert.equal(mediaOf({ source: "tg" }), "Telegram");
  assert.equal(mediaOf({}), "Direct");
  assert.equal(mediaOf({ ad: { source: "telegram", campaign: "desk" } }), "Telegram");
});

test("the report counts the last seven days and keeps recent leads", () => {
  const now = new Date("2026-11-23T16:00:00Z");
  const clicks = [
    JSON.stringify({ createdAt: "2026-11-23T10:00:00Z", gclid: "g", source: "google", campaign: "brand" }),
    JSON.stringify({ createdAt: "2026-11-22T10:00:00Z", source: "bing", extra: { msclkid: "m" } }),
    JSON.stringify({ createdAt: "2026-11-01T10:00:00Z", source: "tg" }),
    JSON.stringify({ createdAt: "2026-11-23T11:00:00Z" }),
  ].join("\n");
  const requests = [
    JSON.stringify({ createdAt: "2026-11-23T12:00:00Z", email: "ada@example.com", role: "operator", country: "Cyprus", ad: { source: "google", campaign: "brand", keyword: "desk" } }),
  ].join("\n");
  const report = summarizeVisits(clicks, requests, now);
  const google = report.counts.find((item) => item.name === "Google");
  const bing = report.counts.find((item) => item.name === "Bing");
  const telegram = report.counts.find((item) => item.name === "Telegram");
  const direct = report.counts.find((item) => item.name === "Direct");
  assert.equal(google?.clicks, 1);
  assert.equal(google?.leads, 1);
  assert.equal(google?.clicksToday, 1);
  assert.equal(bing?.clicks, 1);
  assert.equal(telegram?.clicks, 0);
  assert.equal(direct?.clicks, 1);
  assert.equal(report.leads[0].email, "ada@example.com");
  assert.equal(report.leads[0].keyword, "desk");
});

test("a click keeps the visit fields and the filters narrow them", () => {
  const now = new Date("2026-11-23T16:00:00Z");
  const google = clickDetail({
    createdAt: "2026-11-23T10:00:00Z",
    path: "/request",
    country: "Cyprus",
    ip: "203.0.113.8",
    device: "Computer",
    system: "Windows",
    browser: "Chrome",
    gclid: "abc",
    source: "google",
    campaign: "brand",
    keyword: "desk",
    match: "Exact",
    network: "Google Search",
    extra: { msclkid: "should-not-win" },
  });
  const direct = clickDetail({ createdAt: "2026-11-23T11:00:00Z", path: "/", country: "Germany" });
  assert.equal(google.media, "Google");
  assert.equal(google.keyword, "desk");
  assert.equal(google.ip, "203.0.113.8");
  assert.match(google.details, /gclid: abc/);
  assert.match(google.details, /msclkid: should-not-win/);
  const query = visitQuery({ media: "Google", country: "Cyprus", range: "today", q: "desk" });
  assert.deepEqual(filterClicks([google, direct], query, now).map((row) => row.page), ["/request"]);
});

test("a password matches only the saved value", () => {
  assert.equal(passwordMatches("correct-horse", "correct-horse"), true);
  assert.equal(passwordMatches("wrong", "correct-horse"), false);
  assert.equal(passwordMatches("", "correct-horse"), false);
});
