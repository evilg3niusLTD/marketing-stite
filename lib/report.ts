import { createHmac, timingSafeEqual } from "crypto";
import { readFile } from "fs/promises";

export const MEDIA = ["Google", "Bing", "Telegram", "Direct"] as const;
export type MediaName = (typeof MEDIA)[number] | "Other";

export type ReportLead = {
  at: string;
  media: MediaName;
  campaign: string;
  keyword: string;
  email: string;
  role: string;
  country: string;
};

export type MediaCount = {
  name: MediaName;
  clicks: number;
  leads: number;
  clicksToday: number;
  leadsToday: number;
};

const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function reportToken(password: string) {
  return createHmac("sha256", password).update("trafficlight-visits").digest("hex");
}

export function passwordMatches(given: string, password: string) {
  const left = Buffer.from(given);
  const right = Buffer.from(password);
  if (left.length === 0 || left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function mediaOf(record: Record<string, unknown>): MediaName {
  const ad = record.ad && typeof record.ad === "object" ? (record.ad as Record<string, unknown>) : record;
  const extra = ad.extra && typeof ad.extra === "object" ? (ad.extra as Record<string, unknown>) : {};
  const source = String(ad.source || "").toLowerCase();
  if (ad.gclid || source === "google" || source === "adwords") return "Google";
  if (extra.msclkid || source === "bing" || source === "microsoft") return "Bing";
  if (source === "tg" || source === "telegram" || source === "t.me") return "Telegram";
  if (source || ad.campaign || ad.keyword || ad.campaignId) return "Other";
  return "Direct";
}

export function summarizeVisits(clicks: string, requests: string, now: Date) {
  const start = now.getTime() - WINDOW_MS;
  const today = dayKey(now.toISOString());
  const counts = new Map<MediaName, MediaCount>();
  for (const name of [...MEDIA, "Other"] as MediaName[]) {
    counts.set(name, { name, clicks: 0, leads: 0, clicksToday: 0, leadsToday: 0 });
  }
  for (const row of rowsFrom(clicks)) {
    const at = Date.parse(String(row.createdAt || ""));
    if (!Number.isFinite(at) || at < start) continue;
    const bucket = counts.get(mediaOf(row));
    if (!bucket) continue;
    bucket.clicks += 1;
    if (dayKey(String(row.createdAt)) === today) bucket.clicksToday += 1;
  }
  const leads: ReportLead[] = [];
  for (const row of rowsFrom(requests)) {
    const at = String(row.createdAt || "");
    const parsed = Date.parse(at);
    const lead: ReportLead = {
      at,
      media: mediaOf(row),
      campaign: text(nested(row, "campaign")),
      keyword: text(nested(row, "keyword")),
      email: text(row.email),
      role: text(row.role),
      country: text(row.country),
    };
    leads.push(lead);
    if (!Number.isFinite(parsed) || parsed < start) continue;
    const bucket = counts.get(lead.media);
    if (!bucket) continue;
    bucket.leads += 1;
    if (dayKey(at) === today) bucket.leadsToday += 1;
  }
  const visible = [...counts.values()].filter((item) => item.name !== "Other" || item.clicks > 0 || item.leads > 0);
  return { counts: visible, leads: leads.slice(-25).reverse() };
}

export async function loadVisitReport(now = new Date()) {
  const { dataFile } = await import("@/lib/files");
  const clicks = await readFile(dataFile("clicks.jsonl", process.env.CLICKS_FILE), "utf8").catch(() => "");
  const requests = await readFile(dataFile("requests.jsonl", process.env.REQUESTS_FILE), "utf8").catch(() => "");
  return summarizeVisits(tail(clicks), tail(requests), now);
}

function rowsFrom(text: string) {
  const rows: Record<string, unknown>[] = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as Record<string, unknown>;
      if (row && typeof row === "object") rows.push(row);
    } catch {
      // Skip a damaged line.
    }
  }
  return rows;
}

function nested(row: Record<string, unknown>, key: string) {
  const ad = row.ad && typeof row.ad === "object" ? (row.ad as Record<string, unknown>) : row;
  return ad[key];
}

function text(value: unknown) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
}

function tail(text: string) {
  const lines = text.split("\n");
  return lines.slice(-8000).join("\n");
}

function dayKey(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Nicosia", year: "numeric", month: "2-digit", day: "2-digit" }).format(parsed);
}

export function nicosiaTime(iso: string) {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Nicosia", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(parsed);
}
