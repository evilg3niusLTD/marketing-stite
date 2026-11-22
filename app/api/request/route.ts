import { adDetails, hasAd } from "@/lib/click";
import { saveDeskRequest } from "@/lib/desk-request";
import { parseDeskRequest } from "@/lib/request";
import { visitContext } from "@/lib/visitor";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Send the request as JSON." }, { status: 400 });
  }
  const parsed = parseDeskRequest(input);
  if (!parsed.ok) {
    return Response.json({ ok: false, errors: parsed.errors }, { status: 400 });
  }
  const body = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const params = body.ad && typeof body.ad === "object" ? (body.ad as Record<string, unknown>) : {};
  const ad = adDetails(params);
  const visit = await visitContext(request.headers);
  await saveDeskRequest({
    request: parsed.value,
    visit,
    ad: hasAd(ad) ? ad : undefined,
    source: "form",
  });
  return Response.json({ ok: true });
}
