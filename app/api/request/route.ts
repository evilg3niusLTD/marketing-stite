import { adDetails, hasAd } from "@/lib/click";
import { finishDeskRequest, saveDeskRequest } from "@/lib/desk-request";
import { parseDeskDetails, parseDeskStart } from "@/lib/request";
import { visitContext } from "@/lib/visitor";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send the request as JSON." }, { status: 400 });
  }
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const visit = await visitContext(request.headers);

  if (body.step === "details") {
    const parsed = parseDeskDetails(body);
    if (!parsed.ok) return Response.json({ ok: false, errors: parsed.errors }, { status: 400 });
    const saved = await finishDeskRequest({ id: String(body.id || ""), ...parsed.value });
    if (!saved) return Response.json({ ok: false, error: "That request was not found." }, { status: 404 });
    return Response.json({ ok: true });
  }

  const parsed = parseDeskStart(body);
  if (!parsed.ok) return Response.json({ ok: false, errors: parsed.errors }, { status: 400 });
  const params = body.ad && typeof body.ad === "object" ? (body.ad as Record<string, unknown>) : {};
  const ad = adDetails(params);
  const record = await saveDeskRequest({
    request: parsed.value,
    visit,
    ad: hasAd(ad) ? ad : undefined,
    source: "form",
  });
  return Response.json({ ok: true, id: record.id });
}
