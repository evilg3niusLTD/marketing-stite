export const ROLES = ["operator", "affiliate", "buyer"] as const;

export const VOLUMES = [
  "Under 1,000 leads a month",
  "1,000 to 10,000 leads a month",
  "More than 10,000 leads a month",
  "Not sure yet",
] as const;

export const CHAT_OFFLINE =
  "The assistant is offline right now. Use the request form, or email sales@trafficlight.gg.";

export const CHAT_LIMIT =
  "The chat is paused for this connection today. Use the request form, or email sales@trafficlight.gg.";

export const CHAT_SAVED =
  "Your request is saved. We reply by email or Telegram. You do not need to send the form as well.";

const FACTS = `
TrafficLight supplies the affiliate tracking and lead distribution platform. The visitor's own team operates the desk. There is no self-serve trial on this website. Replies come by email or Telegram.
The public pages are /, /platform, /affiliates, /request, /privacy, and /terms.
A funnel link records the click, the affiliate, and a hit id, then redirects to the landing page. The affiliate posts the lead with that hit id and an API token. One hit id does not open a second lead.
The operator chooses affiliates, buyers, funnels, and deals. A buyer receives a lead only when the country, working hours, priority, and caps allow it. A lead with no open route is parked.
A duplicate email or phone is stored as a duplicate and does not fill a deal cap. Statuses include accepted, rejected, duplicate, registered, parked, first deposit, and a later deposit. A first deposit waits until an operator accepts it. Until then the affiliate sees Call Back. A rejected deposit stays on Call Back unless the operator sets another visible status.
A deal is one week, Monday through Sunday, for one country, one affiliate, and one buyer. Models are cost per lead, cost per first deposit, or revenue share. Billed volume is the sent count, limited by the cap.
An affiliate gets a numeric id, an API token, a click link, and a postback. An affiliate does not configure buyers. The click link looks like /r/eu-fx?affid=1042 and that example is only an illustration.
A lead post can include the affiliate id, funnel code, hit id, name, email, calling code, and phone. The country of that lead is taken from the calling code. An optional IP whitelist can reject a post from another address.
The desk covers clicks, intake, distribution, review, deals, and finance. Finance is buyer invoices and affiliate payouts, from hold to paid. A deal sets a buy price, a sell price, a model, and a cap. There is no public price list on this website.
Statuses an affiliate can see include Accepted, Registered, Duplicate, Call Back, First deposit, and Deposit.
Sales email is sales@trafficlight.gg.
`.trim();

const SYSTEM = `You are the assistant on the TrafficLight marketing site. Answer only from the facts below. If a fact is not there, say you do not have it and offer the request form. Do not promise volume, conversion rate, revenue, prices, or named buyers. Do not invent a product that is not described. You are not a human operator. A person from TrafficLight may also reply in this chat. Do not speak as that person, and do not claim their words are yours.

Answer the visitor's question first. The first sentences must answer what they asked. Do not open by asking for an email, Telegram, role, countries, or volume. After the answer, offer one useful next step: either one product question they have not asked, or one missing desk field. When you ask for a role, use the word role. When you ask for volume, use the word volume. The site shows those choices as buttons.

A desk request needs an email address, a Telegram username, a role, the countries they run, and a monthly lead volume. Role is one of: ${ROLES.join(", ")}. Volume is one of: ${VOLUMES.join("; ")}. Call submit_desk_request only when all five are already known. Do not call it to ask for them. Do not call it with a blank or a guessed email or username. After the tool succeeds, the site tells them it was saved, so do not claim it was saved before the tool runs.

Keep each reply under 120 words. Use plain sentences. Do not include notes, tags, or a thinking step.

Facts:
${FACTS}`;

export type ChatMessage = { role: "user" | "assistant" | "human"; content: string };

export type ChatLimits = {
  perIp: number;
  daily: number;
  ip: Map<string, { day: string; count: number }>;
  all: { day: string; count: number };
};

const TOOL_INPUT = {
  type: "object",
  additionalProperties: false,
  properties: {
    email: { type: "string" },
    telegram: { type: "string" },
    role: { type: "string", enum: [...ROLES] },
    countries: { type: "string" },
    volume: { type: "string", enum: [...VOLUMES] },
  },
  required: ["email", "telegram", "role", "countries", "volume"],
};

export function runtimeEnv(name: string) {
  const env = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
  return env?.[name] || "";
}

export function parseChatRequest(input: unknown): { ok: true; messages: ChatMessage[]; path: string; ad: Record<string, unknown>; session: string } | { ok: false; error: string } {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const raw = Array.isArray(body.messages) ? body.messages : [];
  if (raw.length < 1 || raw.length > 12) return { ok: false, error: "Send one question at a time." };
  const messages: ChatMessage[] = [];
  for (const item of raw) {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const role = row.role === "assistant" || row.role === "human" || row.role === "user" ? row.role : "";
    const content = String(row.content || "").replace(/\s+/g, " ").trim();
    if (!role || content.length < 1 || content.length > 800) return { ok: false, error: "Keep the message short." };
    messages.push({ role, content });
  }
  if (messages[messages.length - 1].role !== "user") return { ok: false, error: "Send a question." };
  const path = String(body.path || "/").trim();
  const safePath = path.startsWith("/") && !path.includes("..") && /^\/[\w\-./]*$/.test(path) ? path.slice(0, 80) : "/";
  const ad = body.ad && typeof body.ad === "object" ? (body.ad as Record<string, unknown>) : {};
  const session = String(body.session || "");
  const safeSession = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(session) ? session : "";
  return { ok: true, messages, path: safePath, ad, session: safeSession };
}

export function allowChat(ip: string, now: Date, limits: ChatLimits) {
  const day = now.toISOString().slice(0, 10);
  if (limits.all.day !== day) {
    limits.all.day = day;
    limits.all.count = 0;
  }
  const current = limits.ip.get(ip);
  const bucket = current && current.day === day ? current : { day, count: 0 };
  if (bucket.count >= limits.perIp || limits.all.count >= limits.daily) return false;
  bucket.count += 1;
  limits.all.count += 1;
  limits.ip.set(ip, bucket);
  return true;
}

export type BedrockContent = Record<string, unknown>;

export type BedrockMessage = { role: "user" | "assistant"; content: BedrockContent[] };

export function bedrockRequest(messages: ChatMessage[], path: string, modelId: string, extra: BedrockMessage[] = []) {
  return {
    modelId,
    system: [{ text: `${SYSTEM}\n\nThe visitor is on ${path}.` }],
    messages: [
      ...messages.map((message) => ({
        role: message.role === "human" ? "assistant" : message.role,
        content: [{ text: message.role === "human" ? `A person from TrafficLight told the visitor: ${message.content}` : message.content }],
      })),
      ...extra,
    ],
    toolConfig: {
      tools: [
        {
          toolSpec: {
            name: "submit_desk_request",
            description: "Save a desk request only after the question is answered and every field is already known.",
            inputSchema: { json: TOOL_INPUT },
          },
        },
      ],
    },
    inferenceConfig: { maxTokens: 420, temperature: 0.2 },
  };
}

export function toolCorrection(assistantContent: BedrockContent[], toolUseId: string, detail: string): BedrockMessage[] {
  return [
    { role: "assistant", content: assistantContent },
    {
      role: "user",
      content: [{ toolResult: { toolUseId, content: [{ text: detail }], status: "error" } }],
    },
  ];
}

export type ModelTurn = { reply: string; submit?: unknown; toolUseId?: string; content: BedrockContent[] };

export function visibleReply(text: string) {
  return text
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, " ")
    .replace(/<thinking>[\s\S]*$/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1200);
}

export function readBedrockTurn(payload: unknown): ModelTurn {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const output = root.output && typeof root.output === "object" ? (root.output as Record<string, unknown>) : {};
  const message = output.message && typeof output.message === "object" ? (output.message as Record<string, unknown>) : {};
  const content = Array.isArray(message.content) ? (message.content as BedrockContent[]) : [];
  const texts = content
    .map((block) => (typeof block.text === "string" ? block.text : ""))
    .filter(Boolean);
  const reply = visibleReply(texts.join(" "));
  const call = content.find((block) => {
    const tool = block.toolUse && typeof block.toolUse === "object" ? (block.toolUse as Record<string, unknown>) : {};
    return tool.name === "submit_desk_request";
  });
  if (!call) return { reply, content };
  const tool = call.toolUse as Record<string, unknown>;
  const submit = tool.input && typeof tool.input === "object" ? tool.input : {};
  const toolUseId = typeof tool.toolUseId === "string" ? tool.toolUseId : "";
  return { reply, submit, toolUseId, content };
}
