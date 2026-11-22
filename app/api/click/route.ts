import { appendFile, mkdir, readFile } from "fs/promises";
import path from "path";
import { clickAlert, parseSiteClick } from "@/lib/click";
import { dataFile } from "@/lib/files";
import { sendTelegram } from "@/lib/telegram";
import { visitContext } from "@/lib/visitor";

export const runtime = "nodejs";

function clicksFile() {
  return dataFile("clicks.jsonl", process.env.CLICKS_FILE);
}

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send the click as JSON." }, { status: 400 });
  }
  const parsed = parseSiteClick(input);
  if (!parsed.ok) return Response.json({ ok: false, error: parsed.error }, { status: 400 });
  const file = clicksFile();
  await mkdir(path.dirname(file), { recursive: true });
  const existing = await readFile(file, "utf8").catch(() => "");
  if (existing.includes(parsed.value.id)) return Response.json({ ok: true, duplicate: true });
  const visit = await visitContext(request.headers);
  const record = {
    createdAt: new Date().toISOString(),
    ...parsed.value,
    country: visit.country,
    ip: visit.ip,
    device: parsed.value.device || visit.device,
    system: visit.system,
    browser: visit.browser,
  };
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
  await sendTelegram(clickAlert(record));
  return Response.json({ ok: true });
}
