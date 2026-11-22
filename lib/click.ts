export const AD_PARAMS = [
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "gad_campaignid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "keyword",
  "matchtype",
  "network",
  "device",
  "campaign",
  "campaignid",
  "adgroup",
  "adgroupid",
  "creative",
  "placement",
  "devicemodel",
  "targetid",
  "target",
  "loc_physical_ms",
  "loc_interest_ms",
  "feeditemid",
  "extensionid",
  "assetgroupid",
  "adtype",
  "product_id",
  "product_channel",
  "product_language",
  "product_partition_id",
] as const;

export type AdDetails = {
  keyword: string;
  match: string;
  network: string;
  device: string;
  source: string;
  medium: string;
  campaign: string;
  campaignId: string;
  adGroup: string;
  adGroupId: string;
  adId: string;
  content: string;
  placement: string;
  deviceModel: string;
  targetId: string;
  placementCategory: string;
  locationId: string;
  interestLocationId: string;
  feedItemId: string;
  assetId: string;
  assetGroupId: string;
  adType: string;
  productId: string;
  productChannel: string;
  productLanguage: string;
  productGroupId: string;
  extra: Record<string, string>;
  gclid: string;
};

const MATCH: Record<string, string> = { e: "Exact", p: "Phrase", b: "Broad", a: "AI Max" };
const NETWORK: Record<string, string> = {
  g: "Google Search",
  s: "Search partners",
  d: "Display",
  u: "Smart Shopping",
  ytv: "YouTube",
  vp: "Google video partners",
  gtv: "Google TV",
  x: "Performance Max",
  e: "App",
};
const DEVICE: Record<string, string> = { m: "Mobile", t: "Tablet", c: "Computer" };

function text(value: unknown, max: number) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function clean(value: string) {
  const cleaned = value.replace(/\+/g, " ").replace(/\s+/g, " ").trim().slice(0, 180);
  if (!cleaned || /^\{[a-z0-9_]+\}$/i.test(cleaned)) return "";
  return cleaned;
}

function labeled(code: string, labels: Record<string, string>) {
  const raw = code.toLowerCase();
  if (!raw || /^\{[a-z0-9_]+\}$/i.test(raw)) return "";
  return labels[raw] || text(code, 40);
}

function searchQuery(referrer: string) {
  try {
    const url = new URL(referrer);
    return url.searchParams.get("q") || url.searchParams.get("p") || url.searchParams.get("query") || "";
  } catch {
    return "";
  }
}

function nameAndId(nameValue: string, idValue: string) {
  const name = clean(nameValue);
  const id = clean(idValue);
  if (id) return { name: /^\d+$/.test(name) ? "" : name, id };
  if (/^\d+$/.test(name)) return { name: "", id: name };
  return { name, id: "" };
}

export function adDetails(params: Record<string, unknown>, referrer = ""): AdDetails {
  const picked: Record<string, string> = {};
  for (const name of AD_PARAMS) picked[name] = text(params[name], 180);
  const campaign = nameAndId(picked.utm_campaign || picked.campaign, picked.campaignid || picked.gad_campaignid || picked.utm_id);
  const adGroup = nameAndId(picked.adgroup, picked.adgroupid);
  const known = new Set<string>(AD_PARAMS);
  const extra: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (known.has(key) || !/^[a-z][a-z0-9_]{0,40}$/i.test(key)) continue;
    const item = clean(text(value, 180));
    if (item) extra[key] = item;
  }
  return {
    keyword: clean(picked.keyword || picked.utm_term || searchQuery(referrer)),
    match: labeled(picked.matchtype, MATCH),
    network: labeled(picked.network, NETWORK),
    device: labeled(picked.device, DEVICE),
    source: clean(picked.utm_source),
    medium: clean(picked.utm_medium),
    campaign: campaign.name,
    campaignId: campaign.id,
    adGroup: adGroup.name,
    adGroupId: adGroup.id,
    adId: clean(picked.creative),
    content: clean(picked.utm_content),
    placement: clean(picked.placement),
    deviceModel: clean(picked.devicemodel),
    targetId: clean(picked.targetid),
    placementCategory: clean(picked.target),
    locationId: clean(picked.loc_physical_ms),
    interestLocationId: clean(picked.loc_interest_ms),
    feedItemId: clean(picked.feeditemid),
    assetId: clean(picked.extensionid),
    assetGroupId: clean(picked.assetgroupid),
    adType: clean(picked.adtype),
    productId: clean(picked.product_id),
    productChannel: clean(picked.product_channel),
    productLanguage: clean(picked.product_language),
    productGroupId: clean(picked.product_partition_id),
    extra,
    gclid: text(picked.gclid || picked.gbraid || picked.wbraid, 180),
  };
}

export function hasAd(ad: AdDetails) {
  const { extra, ...rest } = ad;
  return Object.values(rest).some(Boolean) || Object.keys(extra).length > 0;
}

type VisitFields = { country?: string; ip?: string; device?: string; system?: string; browser?: string };

function visitLines(visit: VisitFields) {
  const lines: string[] = [];
  if (visit.country) lines.push(`Country: ${visit.country}`);
  if (visit.device) lines.push(`Device: ${visit.device}`);
  if (visit.system) lines.push(`System: ${visit.system}`);
  if (visit.browser) lines.push(`Browser: ${visit.browser}`);
  return lines;
}

export function leadAlert(record: { email: string; telegram: string; role: string; countries: string; volume: string; source?: string; ad?: AdDetails } & VisitFields) {
  const lines = ["New desk request"];
  if (record.source === "chat") lines.push("From: chat");
  lines.push(`Email: ${record.email}`, `Telegram: ${record.telegram}`, `Role: ${record.role}`, `Countries: ${record.countries}`, `Volume: ${record.volume}`, ...visitLines(record));
  if (record.ad && hasAd(record.ad)) lines.push(...adLines(record.ad));
  return lines.join("\n");
}

export function clickAlert(record: SiteClick & VisitFields) {
  const lines = ["New site click", `Page: ${record.path}`, ...visitLines(record), ...adLines(record)];
  if (record.referrer) {
    const google = lines[lines.length - 1] === "Google click: yes" ? lines.length - 1 : lines.length;
    lines.splice(google, 0, `From: ${record.referrer}`);
  }
  return lines.join("\n");
}

export function adLines(ad: AdDetails) {
  const lines: string[] = [];
  if (ad.keyword) lines.push(`Keyword: ${ad.keyword}`);
  if (ad.match) lines.push(`Match: ${ad.match}`);
  if (ad.campaign) lines.push(`Campaign: ${ad.campaign}`);
  if (ad.campaignId) lines.push(`Campaign id: ${ad.campaignId}`);
  if (ad.adGroup) lines.push(`Ad group: ${ad.adGroup}`);
  if (ad.adGroupId) lines.push(`Ad group id: ${ad.adGroupId}`);
  if (ad.adId) lines.push(`Ad id: ${ad.adId}`);
  if (ad.content) lines.push(`Ad content: ${ad.content}`);
  if (ad.source || ad.medium) lines.push(`Source: ${[ad.source, ad.medium].filter(Boolean).join(" / ")}`);
  if (ad.network) lines.push(`Network: ${ad.network}`);
  if (ad.deviceModel) lines.push(`Device model: ${ad.deviceModel}`);
  if (ad.placement) lines.push(`Placement: ${ad.placement}`);
  if (ad.placementCategory) lines.push(`Placement category: ${ad.placementCategory}`);
  if (ad.targetId) lines.push(`Target id: ${ad.targetId}`);
  if (ad.locationId) lines.push(`Location id: ${ad.locationId}`);
  if (ad.interestLocationId) lines.push(`Location of interest: ${ad.interestLocationId}`);
  if (ad.assetId) lines.push(`Asset id: ${ad.assetId}`);
  if (ad.feedItemId) lines.push(`Feed item id: ${ad.feedItemId}`);
  if (ad.assetGroupId) lines.push(`Asset group id: ${ad.assetGroupId}`);
  if (ad.adType) lines.push(`Ad type: ${ad.adType}`);
  if (ad.productId) lines.push(`Product id: ${ad.productId}`);
  if (ad.productChannel) lines.push(`Product channel: ${ad.productChannel}`);
  if (ad.productLanguage) lines.push(`Product language: ${ad.productLanguage}`);
  if (ad.productGroupId) lines.push(`Product group id: ${ad.productGroupId}`);
  for (const key of Object.keys(ad.extra).sort()) lines.push(`${key}: ${ad.extra[key]}`);
  if (ad.gclid) lines.push("Google click: yes");
  return lines;
}

export type SiteClick = AdDetails & {
  id: string;
  path: string;
  referrer: string;
};

function referrerLabel(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`.slice(0, 180);
  } catch {
    return "";
  }
}

export function parseSiteClick(input: unknown): { ok: true; value: SiteClick } | { ok: false; error: string } {
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const id = text(body.id, 40);
  const path = text(body.path, 80);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return { ok: false, error: "Missing click id." };
  }
  if (!path.startsWith("/") || path.includes("..") || /[^\w\-./]/.test(path)) {
    return { ok: false, error: "Missing page." };
  }
  const referrer = text(body.referrer, 500);
  const params = body.params && typeof body.params === "object" ? (body.params as Record<string, unknown>) : {};
  return {
    ok: true,
    value: {
      id,
      path,
      referrer: referrerLabel(referrer),
      ...adDetails(params, referrer),
    },
  };
}
