import { randomUUID } from "crypto";
import { appendFile, mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { hasAd, leadAlert, type AdDetails } from "@/lib/click";
import { dataFile } from "@/lib/files";
import type { DeskStart, RequestVolume } from "@/lib/request";
import { deliverTelegram, telegramChatId } from "@/lib/telegram";
import type { VisitContext } from "@/lib/visitor";

export async function saveDeskRequest(input: {
  request: DeskStart & { telegram?: string; countries?: string; volume?: RequestVolume };
  visit: VisitContext;
  ad?: AdDetails;
  source: "form" | "chat";
}) {
  const ad = input.ad && hasAd(input.ad) ? input.ad : undefined;
  const record = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input.request,
    source: input.source,
    country: input.visit.country,
    ip: input.visit.ip,
    device: ad?.device || input.visit.device,
    system: input.visit.system,
    browser: input.visit.browser,
    ...(ad ? { ad } : {}),
  };
  const file = dataFile("requests.jsonl", process.env.REQUESTS_FILE);
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
  await deliverTelegram(leadAlert({ ...input.request, ...input.visit, device: record.device, source: input.source, ad }), telegramChatId("leads"));
  return record;
}

export async function finishDeskRequest(input: { id: string; telegram: string; countries: string; volume: string }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)) return null;
  const file = dataFile("requests.jsonl", process.env.REQUESTS_FILE);
  const text = await readFile(file, "utf8").catch(() => "");
  let found: Record<string, unknown> | null = null;
  const next = text
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      try {
        const row = JSON.parse(line) as Record<string, unknown>;
        if (row.id !== input.id) return line;
        found = { ...row, telegram: input.telegram, countries: input.countries, volume: input.volume, completedAt: new Date().toISOString() };
        return JSON.stringify(found);
      } catch {
        return line;
      }
    });
  if (!found) return null;
  await writeFile(file, `${next.join("\n")}\n`, "utf8");
  const saved = found as { email?: string; role?: string; source?: "form" | "chat"; country?: string; ip?: string; device?: string; system?: string; browser?: string };
  await deliverTelegram(leadAlert({
    email: String(saved.email || ""),
    role: String(saved.role || ""),
    telegram: input.telegram,
    countries: input.countries,
    volume: input.volume,
    source: saved.source,
    country: saved.country,
    ip: saved.ip,
    device: saved.device,
    system: saved.system,
    browser: saved.browser,
    updated: true,
  }), telegramChatId("leads"));
  return found;
}
