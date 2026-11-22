import { open, type Reader, type CountryResponse } from "maxmind";

export type VisitContext = {
  country: string;
  ip: string;
  device: string;
  system: string;
  browser: string;
};

let readerPromise: Promise<Reader<CountryResponse> | null> | undefined;

function publicIp(value: string) {
  const ip = value.trim().replace(/^::ffff:/, "");
  if (!ip || ip.includes("%")) return "";
  if (ip === "::1" || ip.startsWith("fc") || ip.startsWith("fd") || ip.startsWith("fe80:")) return "";
  const v4 = ip.split(".");
  if (v4.length === 4) {
    const n = v4.map((part) => Number(part));
    if (n.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return "";
    if (n[0] === 10 || n[0] === 127 || (n[0] === 172 && n[1] >= 16 && n[1] <= 31) || (n[0] === 192 && n[1] === 168)) return "";
    return ip;
  }
  return ip.includes(":") ? ip : "";
}

export function clientAddress(headers: Headers) {
  const real = publicIp(headers.get("x-real-ip") || "");
  if (real) return real;
  for (const part of (headers.get("x-forwarded-for") || "").split(",")) {
    const ip = publicIp(part);
    if (ip) return ip;
  }
  return "";
}

export function browserProfile(userAgent: string): Omit<VisitContext, "country" | "ip"> {
  const lower = userAgent.toLowerCase();
  if (!userAgent.trim()) return { device: "", system: "", browser: "" };
  if (/bot|spider|crawler|headless/.test(lower)) return { device: "Bot", system: "", browser: "" };
  let device = "Computer";
  if (/ipad|tablet|sm-t|kindle|silk/.test(lower)) device = "Tablet";
  else if (/mobi|iphone|ipod|android.+mobile|windows phone/.test(lower)) device = "Mobile";
  else if (/android/.test(lower)) device = "Tablet";
  let system = "";
  if (/android/.test(lower)) system = "Android";
  else if (/iphone|ipad|ipod/.test(lower)) system = "iOS";
  else if (/cros/.test(lower)) system = "ChromeOS";
  else if (/mac os x|macintosh/.test(lower)) system = "macOS";
  else if (/windows nt/.test(lower)) system = "Windows";
  else if (/linux/.test(lower)) system = "Linux";
  let browser = "";
  if (/edg\/|edgios/.test(lower)) browser = "Edge";
  else if (/opr\/|opera/.test(lower)) browser = "Opera";
  else if (/fxios|firefox\//.test(lower)) browser = "Firefox";
  else if (/crios|chrome\//.test(lower)) browser = "Chrome";
  else if (/safari\//.test(lower)) browser = "Safari";
  return { device, system, browser };
}

async function countryReader() {
  if (!readerPromise) {
    const file = process.env.GEOIP_DB;
    readerPromise = file ? open<CountryResponse>(file).catch(() => null) : Promise.resolve(null);
  }
  return readerPromise;
}

export async function countryName(ip: string) {
  if (!ip) return "";
  const db = await countryReader();
  const row = db?.get(ip);
  const named = row?.country?.names?.en || "";
  if (named) return named;
  const code = row?.country?.iso_code || "";
  if (!code) return "";
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code;
}

export async function visitContext(headers: Headers): Promise<VisitContext> {
  const profile = browserProfile(headers.get("user-agent") || "");
  const ip = clientAddress(headers);
  return { country: await countryName(ip), ip, ...profile };
}
