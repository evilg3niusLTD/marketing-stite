import assert from "node:assert/strict";
import test from "node:test";
import { parseDeskDetails, parseDeskRequest, parseDeskStart } from "./request.ts";

test("a complete request is accepted", () => {
  const parsed = parseDeskRequest({
    email: "ada@example.com",
    telegram: "https://t.me/ada_ops",
    role: "operator",
    countries: "GB, DE",
    volume: "Under 1,000 leads a month",
  });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.telegram, "@ada_ops");
    assert.equal(parsed.value.countries, "GB, DE");
  }
});

test("email and role are enough to start a request", () => {
  const parsed = parseDeskStart({ email: "ada@example.com", role: "operator" });
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.value.email, "ada@example.com");
    assert.equal(parsed.value.role, "operator");
  }
});

test("a start without an email is rejected", () => {
  const parsed = parseDeskStart({ role: "buyer" });
  assert.equal(parsed.ok, false);
  if (!parsed.ok) assert.equal(typeof parsed.errors.email, "string");
});

test("the second step accepts telegram, countries, and volume", () => {
  const parsed = parseDeskDetails({
    telegram: "@ada_ops",
    countries: "GB",
    volume: "Not sure yet",
  });
  assert.equal(parsed.ok, true);
});

test("an empty request is rejected and keeps every field", () => {
  const parsed = parseDeskRequest({});
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.deepEqual(Object.keys(parsed.errors).sort(), ["countries", "email", "role", "telegram", "volume"]);
  }
});
