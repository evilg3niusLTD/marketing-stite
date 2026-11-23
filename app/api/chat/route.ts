import { BedrockRuntimeClient, ConverseCommand, type ConverseCommandInput } from "@aws-sdk/client-bedrock-runtime";
import { adDetails, hasAd } from "@/lib/click";
import {
  allowChat,
  bedrockRequest,
  CHAT_LIMIT,
  CHAT_OFFLINE,
  CHAT_SAVED,
  parseChatRequest,
  readBedrockTurn,
  runtimeEnv,
  toolCorrection,
  type BedrockMessage,
  type ChatLimits,
  type ChatMessage,
  type ModelTurn,
} from "@/lib/chat";
import { saveDeskRequest } from "@/lib/desk-request";
import { recordChatTurn } from "@/lib/live-chat";
import { parseDeskRequest, type RequestErrors } from "@/lib/request";
import { clientAddress, visitContext, type VisitContext } from "@/lib/visitor";

export const runtime = "nodejs";

const limits: ChatLimits = {
  perIp: 20,
  daily: 400,
  ip: new Map(),
  all: { day: "", count: 0 },
};

function correction(errors: RequestErrors) {
  return `The request was not saved. ${Object.values(errors).join(" ")} Ask only for what is still missing.`;
}

async function ask(messages: ChatMessage[], path: string, extra: BedrockMessage[] = []): Promise<ModelTurn | null> {
  const region = runtimeEnv("BEDROCK_REGION");
  const modelId = runtimeEnv("BEDROCK_MODEL_ID") || "amazon.nova-lite-v1:0";
  if (!region) return null;
  try {
    const client = new BedrockRuntimeClient({ region });
    const response = await client.send(new ConverseCommand(bedrockRequest(messages, path, modelId, extra) as ConverseCommandInput), {
      abortSignal: AbortSignal.timeout(12000),
    });
    return readBedrockTurn(response);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send the chat as JSON." }, { status: 400 });
  }
  const parsed = parseChatRequest(input);
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  const visit = await visitContext(request.headers);
  const relay = (reply: string) => remember(parsed.session, parsed.path, parsed.messages, reply, visit);

  if (!runtimeEnv("BEDROCK_REGION")) {
    await relay(CHAT_OFFLINE);
    return Response.json({ ok: true, reply: CHAT_OFFLINE, offline: true });
  }
  const ip = visit.ip || clientAddress(request.headers) || "unknown";
  if (!allowChat(ip, new Date(), limits)) {
    await relay(CHAT_LIMIT);
    return Response.json({ ok: true, reply: CHAT_LIMIT, limited: true });
  }

  const turn = await ask(parsed.messages, parsed.path);
  if (!turn) {
    await relay(CHAT_OFFLINE);
    return Response.json({ ok: true, reply: CHAT_OFFLINE, offline: true });
  }
  if (turn.submit === undefined) {
    const reply = turn.reply || CHAT_OFFLINE;
    await relay(reply);
    return Response.json({ ok: true, reply });
  }

  const lead = parseDeskRequest(turn.submit);
  if (!lead.ok && turn.reply) {
    await relay(turn.reply);
    return Response.json({ ok: true, reply: turn.reply });
  }
  if (lead.ok) {
    const ad = adDetails(parsed.ad);
    await saveDeskRequest({
      request: lead.value,
      visit,
      ad: hasAd(ad) ? ad : undefined,
      source: "chat",
    });
    await relay(CHAT_SAVED);
    return Response.json({ ok: true, reply: CHAT_SAVED, saved: true, email: lead.value.email });
  }

  const follow = turn.toolUseId
    ? await ask(parsed.messages, parsed.path, toolCorrection(turn.content, turn.toolUseId, correction(lead.errors)))
    : null;
  if (follow?.submit !== undefined) {
    const again = parseDeskRequest(follow.submit);
    if (again.ok) {
      const ad = adDetails(parsed.ad);
      await saveDeskRequest({
        request: again.value,
        visit,
        ad: hasAd(ad) ? ad : undefined,
        source: "chat",
      });
      await relay(CHAT_SAVED);
      return Response.json({ ok: true, reply: CHAT_SAVED, saved: true, email: again.value.email });
    }
  }
  const reply = follow?.reply || Object.values(lead.errors).join(" ");
  await relay(reply);
  return Response.json({ ok: true, reply });
}

async function remember(session: string, page: string, messages: ChatMessage[], reply: string, visit: VisitContext) {
  const visitor = [...messages].reverse().find((message) => message.role === "user")?.content || "";
  if (!session || !visitor) return;
  try {
    await recordChatTurn({ session, page, visitor, assistant: reply, country: visit.country, ip: visit.ip });
  } catch {
    // The visitor still gets the answer when the live relay fails.
  }
}
