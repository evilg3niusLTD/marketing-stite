import assert from "node:assert/strict";
import test from "node:test";
import { parseDeskRequest } from "./request.ts";

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

test("an empty request is rejected and keeps every field", () => {
  const parsed = parseDeskRequest({});
  assert.equal(parsed.ok, false);
  if (!parsed.ok) {
    assert.deepEqual(Object.keys(parsed.errors).sort(), ["countries", "email", "role", "telegram", "volume"]);
  }
});
