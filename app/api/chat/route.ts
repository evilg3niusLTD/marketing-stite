import { allowChat, parseChatRequest, type ChatLimits } from "@/lib/chat";
import { recordChatTurn } from "@/lib/live-chat";
import { clientAddress } from "@/lib/visitor";

export const runtime = "nodejs";

const limits: ChatLimits = {
  perIp: 20,
  daily: 400,
  ip: new Map(),
  all: { day: "", count: 0 },
};

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send the chat as JSON." }, { status: 400 });
  }
  const parsed = parseChatRequest(input);
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  if (!parsed.session) return Response.json({ ok: false, error: "Send the chat as JSON." }, { status: 400 });
  const ip = clientAddress(request.headers) || "unknown";
  if (!allowChat(ip, new Date(), limits)) return Response.json({ ok: true, paused: true });
  const visitor = [...parsed.messages].reverse().find((message) => message.role === "user")?.content || "";
  try {
    await recordChatTurn({ session: parsed.session, page: parsed.path, visitor });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true });
}
