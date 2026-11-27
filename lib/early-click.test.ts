import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { parseSiteClick } from "./click.ts";
import { EARLY_CLICK_SCRIPT } from "./early-click.ts";

function run(url: string, storage: Map<string, string>) {
  const posts: Array<{ url: string; body: string; keepalive?: boolean }> = [];
  const context = {
    URLSearchParams,
    Uint8Array,
    crypto: { getRandomValues: (bytes: Uint8Array) => bytes.fill(7) },
    location: new URL(url),
    document: { referrer: "https://www.google.com/" },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    fetch: (target: string, init: { body: string; keepalive?: boolean }) => {
      posts.push({ url: target, body: init.body, keepalive: init.keepalive });
      return Promise.resolve();
    },
    JSON,
    String,
  };
  vm.runInNewContext(EARLY_CLICK_SCRIPT, context);
  return posts;
}

test("an ad click is posted before react and remembered", () => {
  const storage = new Map<string, string>();
  const posts = run("https://trafficlight.gg/?gclid=abc123&keyword=desk&utm_source=google", storage);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].url, "/api/click");
  assert.equal(posts[0].keepalive, true);
  const body = JSON.parse(posts[0].body);
  const parsed = parseSiteClick(body);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.value.path, "/");
  assert.equal(parsed.value.gclid, "abc123");
  assert.equal(parsed.value.keyword, "desk");
  assert.match(storage.get("tl-ad-clicks") || "", /abc123/);
  assert.equal(run("https://trafficlight.gg/?gclid=abc123", storage).length, 0);
});

test("a visit without an ad click id waits for the page script", () => {
  assert.equal(run("https://trafficlight.gg/platform", new Map()).length, 0);
});

test("a storage failure does not throw", () => {
  const context = {
    URLSearchParams,
    Uint8Array,
    crypto: { getRandomValues: (bytes: Uint8Array) => bytes.fill(1) },
    location: new URL("https://trafficlight.gg/?wbraid=w123"),
    document: { referrer: "" },
    localStorage: {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    },
    fetch: () => Promise.resolve(),
    JSON,
    String,
  };
  assert.doesNotThrow(() => vm.runInNewContext(EARLY_CLICK_SCRIPT, context));
});
