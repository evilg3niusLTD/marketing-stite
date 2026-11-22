import { ADS_LEAD_CONVERSION } from "@/lib/site";

export function reportLead(email: string) {
  const w = window as Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void };
  w.dataLayer = w.dataLayer || [];
  if (typeof w.gtag !== "function") {
    w.gtag = function gtag() {
      w.dataLayer?.push(arguments);
    };
  }
  w.gtag("set", "user_data", { email });
  w.gtag("event", "conversion", {
    send_to: ADS_LEAD_CONVERSION,
    value: 1.0,
    currency: "USD",
  });
}
