import { randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

type Sent = { ok: true; messageId: number } | { ok: false };

async function defaultSend(text: string): Promise<Sent> {
  const { deliverTelegram, telegramChatId } = await import("@/lib/telegram");
  return deliverTelegram(text, telegramChatId("live"));
}

export type HumanReply = { id: string; content: string };

type LiveLine = { id: string; role: "user" | "assistant" | "human"; content: string; at: string };

type LiveSession = {
  id: string;
  createdAt: string;
  page: string;
  lines: LiveLine[];
};

type ChatIndex = {
  links: { messageId: number; session: string }[];
  seen: number[];
};

const SESSION = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

let chain: Promise<unknown> = Promise.resolve();

function locked<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function chatDir() {
  return process.env.CHAT_DIR || path.join(process.cwd(), "data", "chats");
}

function sessionFile(id: string) {
  return path.join(chatDir(), `${id}.json`);
}

export function chatAlert(input: { code: string; visitor: string }) {
  return [`Live chat ${input.code}`, `Visitor: ${clip(input.visitor, 500)}`, "Reply to this message to speak in the chat."].join("\n");
}

export function readTelegramReply(update: unknown, expectedChat: string): { replyTo: number; messageId: number; text: string } | null {
  if (!expectedChat) return null;
  const root = update && typeof update === "object" ? (update as Record<string, unknown>) : {};
  const message = root.message && typeof root.message === "object" ? (root.message as Record<string, unknown>) : null;
  if (!message) return null;
  const from = message.from && typeof message.from === "object" ? (message.from as Record<string, unknown>) : {};
  if (from.is_bot) return null;
  const chat = message.chat && typeof message.chat === "object" ? (message.chat as Record<string, unknown>) : {};
  if (String(chat.id || "") !== String(expectedChat)) return null;
  const reply = message.reply_to_message && typeof message.reply_to_message === "object" ? (message.reply_to_message as Record<string, unknown>) : null;
  const replyTo = reply && typeof reply.message_id === "number" ? reply.message_id : 0;
  const messageId = typeof message.message_id === "number" ? message.message_id : 0;
  const text = String(message.text || "").replace(/\s+/g, " ").trim().slice(0, 800);
  if (!replyTo || !messageId || !text) return null;
  return { replyTo, messageId, text };
}

export async function recordChatTurn(input: { session: string; page: string; visitor: string; assistant?: string }, send: (text: string) => Promise<Sent> = defaultSend) {
  if (!SESSION.test(input.session) || !input.visitor) return;
  await locked(async () => {
    await mkdir(chatDir(), { recursive: true });
    const existing = await readSession(input.session);
    const session = existing || { id: input.session, createdAt: new Date().toISOString(), page: input.page, lines: [] };
    session.page = input.page || session.page;
    session.lines.push(line("user", input.visitor));
    if (input.assistant) session.lines.push(line("assistant", input.assistant));
    session.lines = session.lines.slice(-40);
    await writeFile(sessionFile(input.session), JSON.stringify(session), "utf8");
    const sent = await send(chatAlert({
      code: input.session.slice(0, 8),
      visitor: input.visitor,
    }));
    if (!sent.ok) return;
    const index = await readIndex();
    index.links.push({ messageId: sent.messageId, session: input.session });
    index.links = index.links.slice(-500);
    await writeFile(path.join(chatDir(), "index.json"), JSON.stringify(index), "utf8");
  });
}

export async function addHumanReply(input: { replyTo: number; messageId: number; text: string }) {
  return locked(async () => {
    const index = await readIndex();
    if (index.seen.includes(input.messageId)) return false;
    const link = [...index.links].reverse().find((item) => item.messageId === input.replyTo);
    if (!link || !SESSION.test(link.session)) return false;
    const session = await readSession(link.session);
    if (!session) return false;
    session.lines.push(line("human", input.text));
    session.lines = session.lines.slice(-40);
    index.seen.push(input.messageId);
    index.seen = index.seen.slice(-500);
    await mkdir(chatDir(), { recursive: true });
    await writeFile(sessionFile(link.session), JSON.stringify(session), "utf8");
    await writeFile(path.join(chatDir(), "index.json"), JSON.stringify(index), "utf8");
    return true;
  });
}

export async function humanReplies(session: string): Promise<HumanReply[]> {
  if (!SESSION.test(session)) return [];
  const saved = await readSession(session);
  if (!saved) return [];
  return saved.lines.filter((item) => item.role === "human").map((item) => ({ id: item.id, content: item.content }));
}

function line(role: LiveLine["role"], content: string): LiveLine {
  return { id: randomBytes(6).toString("hex"), role, content, at: new Date().toISOString() };
}

function clip(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

async function readSession(id: string): Promise<LiveSession | null> {
  try {
    const parsed = JSON.parse(await readFile(sessionFile(id), "utf8")) as LiveSession;
    if (!parsed || !Array.isArray(parsed.lines)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function readIndex(): Promise<ChatIndex> {
  try {
    const parsed = JSON.parse(await readFile(path.join(chatDir(), "index.json"), "utf8")) as ChatIndex;
    return {
      links: Array.isArray(parsed.links) ? parsed.links : [],
      seen: Array.isArray(parsed.seen) ? parsed.seen : [],
    };
  } catch {
    return { links: [], seen: [] };
  }
}
