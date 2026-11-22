import assert from "node:assert/strict";
import test from "node:test";
import { browserProfile, clientAddress } from "./visitor.ts";

test("a phone is described without the raw agent string", () => {
  const profile = browserProfile("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1");
  assert.deepEqual(profile, { device: "Mobile", system: "iOS", browser: "Safari" });
});

test("a desktop browser is described", () => {
  const profile = browserProfile("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
  assert.deepEqual(profile, { device: "Computer", system: "Windows", browser: "Chrome" });
});

test("the client address ignores a private proxy hop", () => {
  const headers = new Headers({ "x-real-ip": "127.0.0.1", "x-forwarded-for": "203.0.113.8, 10.0.0.4" });
  assert.equal(clientAddress(headers), "203.0.113.8");
});
