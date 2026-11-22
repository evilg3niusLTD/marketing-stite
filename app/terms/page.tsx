import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms and conditions",
  description: "Terms for using trafficlight.gg and for requesting a TrafficLight desk.",
};

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Terms"
      title="Terms and conditions"
      lede="These terms cover use of trafficlight.gg. A live desk is covered by the agreement we send when we set it up. If that agreement says something different, the agreement applies to the desk."
    >
      <h2>What TrafficLight is</h2>
      <p>
        TrafficLight supplies affiliate tracking and lead distribution software. Your team operates the desk: affiliates, buyers, funnels, and deals. TrafficLight does not buy the traffic and does not choose the buyer.
      </p>
      <p>
        Numbers, routes, and statuses on the site are examples of how the desk works. They are not a promise of volume, conversion rate, or revenue.
      </p>

      <h2>Asking for a desk</h2>
      <p>
        There is no self-serve signup. The request form saves your details so we can reply. Sending it, or emailing us, asks for a conversation. It does not open a desk and it does not set a price. Commercial terms are agreed before a desk goes live.
      </p>

      <h2>The operator’s desk</h2>
      <p>If you operate a desk, you are responsible for:</p>
      <ul>
        <li>the affiliates you allow to post</li>
        <li>the buyers you route a lead to</li>
        <li>the offers and countries you run</li>
        <li>having the right to collect the lead data and to send it to those buyers</li>
        <li>the tokens, passwords, and any IP whitelist on your accounts</li>
      </ul>
      <p>
        An affiliate posts traffic into a desk and does not configure buyers. A buyer receives the leads the operator’s routes send. A first deposit is credited only after an operator accepts it. Until then, the affiliate sees Call Back.
      </p>

      <h2>Acceptable use</h2>
      <p>
        Do not use the site or a desk to break the law, to post traffic you have no right to send, to disrupt the service, or to take data that is not yours. We can refuse a desk, or suspend one, when the use is unlawful or when it puts the platform or other people at risk.
      </p>

      <h2>The website</h2>
      <p>
        The pages describe the product as it works. We can change the site, these terms, and the privacy policy. The date on each page is the version you are reading. The privacy policy explains what the site and the desk do with personal information.
      </p>

      <h2>Liability</h2>
      <p>
        The website is information about the product. A desk runs under its own agreement. To the extent the law allows, we are not liable for decisions an operator, affiliate, or buyer makes on a desk, including which buyer receives a lead and whether a conversion is credited. We do not exclude liability that the law does not allow us to exclude.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms go to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
