import { createHmac, timingSafeEqual } from "crypto";
import { readFile } from "fs/promises";

export const MEDIA = ["Google", "Bing", "Telegram", "Direct"] as const;
export type MediaName = (typeof MEDIA)[number] | "Other";

export type ReportLead = ClickDetail & {
  email: string;
  role: string;
  telegram: string;
  countries: string;
  volume: string;
};

export type ClickDetail = {
  at: string;
  media: MediaName;
  page: string;
  referrer: string;
  country: string;
  ip: string;
  device: string;
  system: string;
  browser: string;
  campaign: string;
  keyword: string;
  match: string;
  network: string;
  source: string;
  medium: string;
  adGroup: string;
  placement: string;
  details: string;
};

export type VisitQuery = {
  media: string;
  country: string;
  range: string;
  q: string;
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
    const lead: ReportLead = leadDetail(row);
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

export function clickDetail(row: Record<string, unknown>): ClickDetail {
  return {
    at: text(row.createdAt),
    media: mediaOf(row),
    page: text(row.path),
    referrer: text(row.referrer),
    country: text(row.country),
    ip: text(row.ip),
    device: text(row.device),
    system: text(row.system),
    browser: text(row.browser),
    campaign: text(nested(row, "campaign")),
    keyword: text(nested(row, "keyword")),
    match: text(nested(row, "match")),
    network: text(nested(row, "network")),
    source: text(nested(row, "source")),
    medium: text(nested(row, "medium")),
    adGroup: text(nested(row, "adGroup")),
    placement: text(nested(row, "placement")),
    details: detailText(row, ["campaignId", "adGroupId", "adId", "content", "deviceModel", "targetId", "placementCategory", "locationId", "gclid"]),
  };
}

export function leadDetail(row: Record<string, unknown>): ReportLead {
  const visit = clickDetail(row);
  return {
    ...visit,
    email: text(row.email),
    role: text(row.role),
    telegram: text(row.telegram),
    countries: text(row.countries),
    volume: text(row.volume),
    page: text(row.source) === "chat" || text(row.source) === "form" ? text(row.source) : visit.page,
  };
}

export function filterClicks<T extends ClickDetail>(rows: T[], query: VisitQuery, now: Date) {
  const needle = query.q.trim().toLowerCase();
  return rows.filter((row) => {
    if (query.media && row.media !== query.media) return false;
    if (query.country && row.country !== query.country) return false;
    if (!inRange(row.at, query.range, now)) return false;
    if (!needle) return true;
    return searchable(row).includes(needle);
  });
}

export function visitQuery(input: Record<string, string | undefined>): VisitQuery {
  const media = input.media || "";
  const range = input.range || "7";
  return {
    media: media === "Google" || media === "Bing" || media === "Telegram" || media === "Direct" || media === "Other" ? media : "",
    country: text(input.country),
    range: range === "today" || range === "30" || range === "all" ? range : "7",
    q: text(input.q).slice(0, 80),
  };
}

export async function loadVisitReport(now = new Date()) {
  const { dataFile } = await import("@/lib/files");
  const clicks = await readFile(dataFile("clicks.jsonl", process.env.CLICKS_FILE), "utf8").catch(() => "");
  const requests = await readFile(dataFile("requests.jsonl", process.env.REQUESTS_FILE), "utf8").catch(() => "");
  const summary = summarizeVisits(tail(clicks), tail(requests), now);
  const clickList = rowsFrom(tail(clicks)).map(clickDetail).filter((row) => row.at).reverse();
  return { ...summary, clicks: clickList };
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

function detailText(row: Record<string, unknown>, keys: string[]) {
  const parts = keys.map((key) => {
    const value = text(nested(row, key));
    return value ? `${key}: ${value}` : "";
  }).filter(Boolean);
  const extra = nested(row, "extra");
  if (extra && typeof extra === "object") {
    for (const [key, value] of Object.entries(extra as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))) {
      const item = text(value);
      if (item) parts.push(`${key}: ${item}`);
    }
  }
  return parts.join(" · ").slice(0, 500);
}

function inRange(iso: string, range: string, now: Date) {
  const at = Date.parse(iso);
  if (!Number.isFinite(at)) return false;
  if (range === "all") return true;
  if (range === "today") return dayKey(iso) === dayKey(now.toISOString());
  const days = range === "30" ? 30 : 7;
  return at >= now.getTime() - days * 24 * 60 * 60 * 1000;
}

function searchable(row: ClickDetail) {
  const lead = row as ClickDetail & { email?: string; role?: string; telegram?: string; countries?: string; volume?: string };
  return [row.media, row.page, row.referrer, row.country, row.ip, row.device, row.system, row.browser, row.campaign, row.keyword, row.match, row.network, row.source, row.medium, row.adGroup, row.placement, row.details, lead.email, lead.role, lead.telegram, lead.countries, lead.volume]
    .join(" ")
    .toLowerCase();
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
