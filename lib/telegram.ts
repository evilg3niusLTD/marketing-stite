export type TelegramResult = "sent" | "skipped" | "failed";

export async function sendTelegram(text: string): Promise<TelegramResult> {
  const sent = await deliverTelegram(text);
  return sent.ok ? "sent" : sent.reason;
}

export async function deliverTelegram(text: string): Promise<{ ok: true; messageId: number } | { ok: false; reason: Exclude<TelegramResult, "sent"> }> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return { ok: false, reason: "skipped" };
  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    });
    const data = (await response.json().catch(() => null)) as { result?: { message_id?: number } } | null;
    const messageId = data?.result?.message_id;
    if (!response.ok || typeof messageId !== "number") return { ok: false, reason: "failed" };
    return { ok: true, messageId };
  } catch {
    return { ok: false, reason: "failed" };
  }
}
