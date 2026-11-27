import assert from "node:assert/strict";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import test from "node:test";
import { addHumanReply, chatAlert, humanReplies, readTelegramReply, recordChatTurn, rememberLiveGroup } from "./live-chat.ts";

test("a live chat alert tells the operator to reply", () => {
  const text = chatAlert({ code: "abc12345", visitor: "How does a deal work?" });
  assert.match(text, /Live chat abc12345/);
  assert.match(text, /How does a deal work\?/);
  assert.match(text, /Reply to this message to speak in the chat/);
  assert.doesNotMatch(text, /Page:/);
  assert.doesNotMatch(text, /Country:/);
  assert.doesNotMatch(text, /IP:/);
  assert.doesNotMatch(text, /Assistant:/);
});

test("a new group is remembered separately from the click and lead group", () => {
  const update = { message: { message_id: 3, text: "@bot hi", chat: { id: -1002, type: "supergroup", title: "Site chat" } } };
  assert.deepEqual(rememberLiveGroup(update, "-1001"), { id: "-1002", title: "Site chat" });
  assert.equal(rememberLiveGroup(update, "-1002"), null);
  assert.equal(rememberLiveGroup(update, ["-1001", "-1002"]), null);
  assert.deepEqual(rememberLiveGroup({ message: { chat: { id: -1003, type: "group", title: "Leads" } } }, ["-1001", "-1002"]), { id: "-1003", title: "Leads" });
  assert.equal(rememberLiveGroup({ message: { chat: { id: 7, type: "private" } } }, "-1001"), null);
});

test("a telegram reply is kept only from the operator chat", () => {
  const update = {
    message: {
      message_id: 20,
      text: "I can set the desk up.",
      chat: { id: 42 },
      reply_to_message: { message_id: 11 },
    },
  };
  const kept = readTelegramReply(update, "42");
  assert.deepEqual(kept, { replyTo: 11, messageId: 20, text: "I can set the desk up." });
  assert.equal(readTelegramReply(update, "99"), null);
  assert.equal(readTelegramReply({ message: { message_id: 1, text: "hi", chat: { id: 42 } } }, "42"), null);
});

test("a human reply is stored for the same chat session", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "tl-chat-"));
  const previous = process.env.CHAT_DIR;
  process.env.CHAT_DIR = dir;
  const session = "11111111-1111-4111-8111-111111111111";
  try {
    await recordChatTurn({ session, page: "/", visitor: "I want a desk", assistant: "Tell me your role." }, async () => ({ ok: false }));
    const index = path.join(dir, "index.json");
    const { writeFile } = await import("fs/promises");
    await writeFile(index, JSON.stringify({ links: [{ messageId: 11, session }], seen: [] }));
    const saved = await addHumanReply({ replyTo: 11, messageId: 20, text: "I can set that up." });
    assert.equal(saved, true);
    assert.equal(await addHumanReply({ replyTo: 11, messageId: 20, text: "I can set that up." }), false);
    const replies = await humanReplies(session);
    assert.equal(replies.length, 1);
    assert.equal(replies[0].content, "I can set that up.");
  } finally {
    if (previous === undefined) delete process.env.CHAT_DIR;
    else process.env.CHAT_DIR = previous;
    await rm(dir, { recursive: true, force: true });
  }
});
