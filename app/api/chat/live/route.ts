import { humanReplies } from "@/lib/live-chat";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = new URL(request.url).searchParams.get("session") || "";
  const messages = await humanReplies(session);
  return Response.json({ ok: true, messages });
}
