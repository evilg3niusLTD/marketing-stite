import { timingSafeEqual } from "crypto";
import { addHumanReply, readTelegramReply } from "@/lib/live-chat";

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
  const reply = readTelegramReply(update, process.env.TELEGRAM_CHAT_ID || "");
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
