import { timingSafeEqual } from "crypto";
import { writeFile } from "fs/promises";
import { addHumanReply, readTelegramReply, rememberLiveGroup } from "@/lib/live-chat";
import { telegramChatId } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET || "";
  const got = request.headers.get("x-telegram-bot-api-secret-token") || "";
  if (!sameSecret(got, secret)) return new Response("Unauthorized", { status: 401 });
  let update: unknown;
  try {
    update = await request.json();
  } catch {
    return Response.json({ ok: true });
  }
  const noticed = rememberLiveGroup(update, process.env.TELEGRAM_CHAT_ID || "");
  if (noticed && !process.env.TELEGRAM_LIVE_CHAT_ID) {
    try {
      await writeFile("/opt/trafficlight/data/live-group.json", JSON.stringify({ ...noticed, at: new Date().toISOString() }));
    } catch {
      // The group can be read from the next notice if the disk write fails.
    }
  }
  const reply = readTelegramReply(update, telegramChatId("live"));
  if (reply) {
    try {
      await addHumanReply(reply);
    } catch {
      return Response.json({ ok: false }, { status: 500 });
    }
  }
  return Response.json({ ok: true });
}

function sameSecret(got: string, secret: string) {
  if (!secret || got.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(got), Buffer.from(secret));
}
