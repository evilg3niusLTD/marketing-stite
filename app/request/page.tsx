import type { Metadata } from "next";
import { RequestForm } from "@/components/request-form";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request a desk",
  description: "Ask TrafficLight to set up an affiliate tracking and lead distribution desk.",
};

export default function RequestPage() {
  return (
    <section className="page-hero wrap request-layout">
      <div>
        <p className="kicker">Request a desk</p>
        <h1>Tell us how your team runs traffic.</h1>
        <p className="lede">
          Start with your email and role. Telegram, countries, and volume can follow. There is no self-serve trial on this site. We reply by email or Telegram.
        </p>
        <dl className="contact-facts">
          <div>
            <dt>Email</dt>
            <dd><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></dd>
          </div>
          <div>
            <dt>Useful detail</dt>
            <dd>Countries, roughly how many leads, and whether you are the operator, an affiliate, or a buyer.</dd>
          </div>
        </dl>
      </div>
      <RequestForm />
    </section>
  );
}
