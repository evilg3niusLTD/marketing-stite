import assert from "node:assert/strict";
import test from "node:test";
import { allowChat, bedrockRequest, parseChatRequest, readBedrockTurn, toolCorrection, type ChatLimits } from "./chat.ts";
import { ROLES, VOLUMES } from "./request.ts";

function limits(): ChatLimits {
  return { perIp: 2, daily: 3, ip: new Map(), all: { day: "", count: 0 } };
}

test("a chat turn keeps a short question and a safe page", () => {
  const parsed = parseChatRequest({
    path: "/request",
    messages: [
      { role: "assistant", content: "Which role?" },
      { role: "user", content: "I operate the desk." },
    ],
  });
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.equal(parsed.path, "/request");
  assert.equal(parsed.messages.length, 2);
});

test("a chat turn rejects a long message and a bad page", () => {
  const long = parseChatRequest({ messages: [{ role: "user", content: "a".repeat(801) }] });
  assert.equal(long.ok, false);
  const path = parseChatRequest({ path: "https://evil.example", messages: [{ role: "user", content: "Hello" }] });
  assert.equal(path.ok, true);
  if (!path.ok) return;
  assert.equal(path.path, "/");
});

test("the daily cap stops a third question from one address", () => {
  const store = limits();
  const now = new Date("2026-11-22T12:00:00Z");
  assert.equal(allowChat("203.0.113.8", now, store), true);
  assert.equal(allowChat("203.0.113.8", now, store), true);
  assert.equal(allowChat("203.0.113.8", now, store), false);
  assert.equal(allowChat("203.0.113.9", now, store), true);
  assert.equal(allowChat("203.0.113.10", now, store), false);
});

test("the model request carries the public facts and the submit tool", () => {
  const body = bedrockRequest([{ role: "user", content: "What is a deal?" }], "/platform", "amazon.nova-lite-v1:0");
  assert.equal(body.modelId, "amazon.nova-lite-v1:0");
  assert.match(body.system[0].text, /Answer the visitor's question first/);
  assert.match(body.system[0].text, /one useful next step/);
  assert.match(body.system[0].text, /no public price list/);
  assert.match(body.system[0].text, /Call Back/);
  assert.match(body.system[0].text, /\/platform/);
  assert.equal(body.messages[0].role, "user");
  assert.equal(body.toolConfig.tools[0].toolSpec.name, "submit_desk_request");
  const fields = body.toolConfig.tools[0].toolSpec.inputSchema.json.properties;
  assert.deepEqual(fields.role.enum, ROLES.map((role) => role.value));
  assert.deepEqual(fields.volume.enum, [...VOLUMES]);
});

test("a model reply can carry a desk request", () => {
  const turn = readBedrockTurn({
    output: {
      message: {
        role: "assistant",
        content: [
          { text: "I can save that." },
          {
            toolUse: {
              toolUseId: "tool-1",
              name: "submit_desk_request",
              input: {
                email: "ada@example.com",
                telegram: "@ada_ops",
                role: "operator",
                countries: "CY",
                volume: "Not sure yet",
              },
            },
          },
        ],
      },
    },
  });
  assert.equal(turn.reply, "I can save that.");
  assert.equal(turn.toolUseId, "tool-1");
  assert.deepEqual(turn.submit, {
    email: "ada@example.com",
    telegram: "@ada_ops",
    role: "operator",
    countries: "CY",
    volume: "Not sure yet",
  });
  const follow = toolCorrection(turn.content, "tool-1", "Enter a valid email.");
  assert.equal(follow[1].content[0].toolResult.toolUseId, "tool-1");
});

test("a model reply hides its private notes", () => {
  const turn = readBedrockTurn({
    output: {
      message: {
        content: [{ text: "<thinking>The visitor asked about a deal.</thinking> A deal is one week." }],
      },
    },
  });
  assert.equal(turn.reply, "A deal is one week.");
});

test("plain model text has no saved request", () => {
  const turn = readBedrockTurn({ output: { message: { content: [{ text: "A deal is one week." }] } } });
  assert.equal(turn.reply, "A deal is one week.");
  assert.equal(turn.submit, undefined);
});
