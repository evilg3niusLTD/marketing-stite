import { randomUUID } from "crypto";
import { appendFile, mkdir } from "fs/promises";
import path from "path";
import { hasAd, leadAlert, type AdDetails } from "@/lib/click";
import { dataFile } from "@/lib/files";
import type { DeskRequest } from "@/lib/request";
import { sendTelegram } from "@/lib/telegram";
import type { VisitContext } from "@/lib/visitor";

export async function saveDeskRequest(input: {
  request: DeskRequest;
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
    device: ad?.device || input.visit.device,
    system: input.visit.system,
    browser: input.visit.browser,
    ...(ad ? { ad } : {}),
  };
  const file = dataFile("requests.jsonl", process.env.REQUESTS_FILE);
  await mkdir(path.dirname(file), { recursive: true });
  await appendFile(file, `${JSON.stringify(record)}\n`, "utf8");
  await sendTelegram(leadAlert({ ...input.request, country: input.visit.country, device: record.device, system: input.visit.system, browser: input.visit.browser, source: input.source, ad }));
  return record;
}
