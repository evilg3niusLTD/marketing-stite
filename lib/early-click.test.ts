import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { earlyAdClickScript } from "./early-click.ts";

function run(search: string, store: Map<string, string>, posts: { body: string; keepalive?: boolean }[]) {
  const context = {
    location: { search, pathname: "/" },
    document: { referrer: "https://www.google.com/" },
    localStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    },
    URLSearchParams,
    Uint8Array,
    crypto: { getRandomValues: (bytes: Uint8Array) => globalThis.crypto.getRandomValues(bytes) },
    fetch: (_url: string, init: { body: string; keepalive?: boolean }) => {
      posts.push({ body: init.body, keepalive: init.keepalive });
      return Promise.resolve();
    },
    console,
  };
  vm.runInNewContext(earlyAdClickScript, context);
}

test("an ad click is posted before any later tracker and then deduped", () => {
  const store = new Map<string, string>();
  const posts: { body: string; keepalive?: boolean }[] = [];
  const search = "?gclid=Cj0test&keyword=affiliate+network+platform&matchtype=e";
  run(search, store, posts);
  run(search, store, posts);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].keepalive, true);
  const body = JSON.parse(posts[0].body);
  assert.match(body.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  assert.equal(body.path, "/");
  assert.equal(body.referrer, "https://www.google.com/");
  assert.equal(body.params.gclid, "Cj0test");
  assert.equal(body.params.keyword, "affiliate network platform");
  assert.equal(store.get("tl-ad-clicks"), "Cj0test");
});

test("a visit without an ad click id is left for the page tracker", () => {
  const posts: { body: string }[] = [];
  run("?utm_source=newsletter", new Map(), posts);
  assert.equal(posts.length, 0);
});

test("a broken store does not throw", () => {
  const context = {
    location: { search: "?gclid=abc", pathname: "/" },
    document: { referrer: "" },
    localStorage: {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    },
    URLSearchParams,
    Uint8Array,
    crypto: { getRandomValues: () => { throw new Error("no crypto"); } },
    fetch: () => Promise.resolve(),
  };
  assert.doesNotThrow(() => vm.runInNewContext(earlyAdClickScript, context));
});
