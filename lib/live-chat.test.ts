import assert from "node:assert/strict";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import test from "node:test";
import { addHumanReply, chatAlert, humanReplies, readTelegramReply, recordChatTurn } from "./live-chat.ts";

test("a live chat alert tells the operator to reply", () => {
  const text = chatAlert({
    code: "abc12345",
    page: "/platform",
    country: "Cyprus",
    ip: "203.0.113.8",
    visitor: "How does a deal work?",
    assistant: "A deal is one week.",
    first: true,
  });
  assert.match(text, /Live chat abc12345/);
  assert.match(text, /Page: \/platform/);
  assert.match(text, /Country: Cyprus/);
  assert.match(text, /IP: 203.0.113.8/);
  assert.match(text, /Reply to this message to speak in the chat/);
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
