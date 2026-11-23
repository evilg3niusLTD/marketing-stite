import assert from "node:assert/strict";
import test from "node:test";
import { clickAlert, leadAlert, parseSiteClick } from "./click.ts";

test("a lead alert names the saved fields", () => {
  const text = leadAlert({
    email: "ada@example.com",
    telegram: "@ada_ops",
    role: "affiliate",
    countries: "GB, CY",
    volume: "Not sure yet",
  });
  assert.match(text, /New desk request/);
  assert.doesNotMatch(text, /From: chat/);
  assert.match(text, /ada@example.com/);
  assert.match(text, /@ada_ops/);
  assert.match(text, /affiliate/);
});

test("an email and role are enough for the first alert", () => {
  const text = leadAlert({ email: "ada@example.com", role: "operator" });
  assert.match(text, /New desk request/);
  assert.match(text, /ada@example.com/);
  assert.match(text, /More details: not sent yet/);
  assert.doesNotMatch(text, /Telegram:/);
});

test("a chat lead is marked in the alert", () => {
  const text = leadAlert({
    email: "ada@example.com",
    telegram: "@ada_ops",
    role: "operator",
    countries: "CY",
    volume: "Not sure yet",
    source: "chat",
  });
  assert.match(text, /From: chat/);
});

test("a click alert names the keyword and the rest of the ad", () => {
  const parsed = parseSiteClick({
    id: "11111111-1111-4111-8111-111111111111",
    path: "/request",
    referrer: "https://www.google.com/search?q=traffic",
    params: {
      gclid: "abc",
      utm_source: "google",
      utm_medium: "cpc",
      utm_campaign: "desk",
      utm_term: "lead+software",
      matchtype: "p",
      network: "g",
      device: "m",
      campaignid: "555",
      adgroupid: "777",
      creative: "888",
    },
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.referrer, "www.google.com/search");
  assert.equal(parsed.value.keyword, "lead software");
  const text = clickAlert(parsed.value);
  assert.match(text, /Keyword: lead software/);
  assert.match(text, /Match: Phrase/);
  assert.match(text, /Campaign: desk/);
  assert.match(text, /Campaign id: 555/);
  assert.match(text, /Ad group id: 777/);
  assert.match(text, /Ad id: 888/);
  assert.match(text, /Source: google \/ cpc/);
  assert.match(text, /Network: Google Search/);
  assert.match(text, /Device: Mobile/);
  const withVisit = clickAlert({ ...parsed.value, country: "Cyprus", ip: "203.0.113.8", system: "iOS", browser: "Safari" });
  assert.match(withVisit, /Country: Cyprus/);
  assert.match(withVisit, /IP: 203.0.113.8/);
  assert.match(withVisit, /Browser: Safari/);
  assert.match(text, /Google click: yes/);
});

test("a search referrer supplies the keyword when the ad did not", () => {
  const parsed = parseSiteClick({
    id: "11111111-1111-4111-8111-111111111111",
    path: "/",
    referrer: "https://www.bing.com/search?q=affiliate+tracker",
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.keyword, "affiliate tracker");
});

test("a lead alert repeats the keyword from the click", () => {
  const parsed = parseSiteClick({
    id: "11111111-1111-4111-8111-111111111111",
    path: "/",
    params: { utm_term: "buy leads", matchtype: "e" },
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const text = leadAlert({
    email: "ada@example.com",
    telegram: "@ada_ops",
    role: "operator",
    countries: "CY",
    volume: "Not sure yet",
    ad: parsed.value,
  });
  assert.match(text, /Keyword: buy leads/);
  assert.match(text, /Match: Exact/);
});

test("a click keeps every ad parameter Google sends", () => {
  const parsed = parseSiteClick({
    id: "11111111-1111-4111-8111-111111111111",
    path: "/request",
    params: {
      gclid: "abc",
      devicemodel: "Apple+iPhone",
      targetid: "kwd-123",
      loc_physical_ms: "1023191",
      extensionid: "44",
      assetgroupid: "55",
      product_id: "sku-1",
      customnote: "desk",
    },
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  const text = clickAlert(parsed.value);
  assert.match(text, /Device model: Apple iPhone/);
  assert.match(text, /Target id: kwd-123/);
  assert.match(text, /Location id: 1023191/);
  assert.match(text, /Asset id: 44/);
  assert.match(text, /Asset group id: 55/);
  assert.match(text, /Product id: sku-1/);
  assert.match(text, /customnote: desk/);
});

test("a click without a page is rejected", () => {
  const parsed = parseSiteClick({ id: "not-a-uuid", path: "https://evil.example" });
  assert.equal(parsed.ok, false);
});
