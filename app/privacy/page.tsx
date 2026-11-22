import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { CONTACT_EMAIL, GTM_ID } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How TrafficLight handles website enquiries and lead data on an operator desk.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Privacy"
      title="Privacy policy"
      lede="This page covers trafficlight.gg and the TrafficLight desk. The site is how you contact us. The desk is the platform an operator uses to track clicks, take leads, and route them."
    >
      <h2>Who we are</h2>
      <p>
        TrafficLight operates this website and supplies the platform. Email{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> for a privacy question.
      </p>

      <h2>This website</h2>
      <p>
        The request form saves your email address, Telegram username, role, countries, and rough lead volume on this server so we can reply. It does not open your email app. After the request is saved, we send those same details to a Telegram chat that TrafficLight controls.
      </p>
      <p>
        The chat on this site sends the message you type to Amazon Bedrock so it can answer from the public pages. A request you complete in the chat is saved and sent to that same Telegram chat, marked as coming from the chat. Chat text that does not become a request is not stored on this server.
      </p>
      <p>
        A visit to the site is recorded once for that browser session: the page, the referring site, the country of the connection, the device, system, and browser, and every ad parameter on the address. That includes the keyword, match type, campaign, ad group, device model, network, placement, location id, and ad click id when Google sends them. A desk request from that visit keeps the same details. The visit and the request are sent to the same Telegram chat. The message names the country of the connection and does not include the IP address. The country lookup uses the DB-IP country database, described at <a href="https://db-ip.com">db-ip.com</a>.
      </p>
      <p>
        If you email us as well, we keep that message so we can reply and, if we agree, set up a desk.
      </p>
      <p>
        The server records ordinary access logs: the address that connected, the page, the time, and the browser. We use those logs to run the site and to look into abuse. We do not sell information from this site.
      </p>

      <h2>Google Ads</h2>
      <p>
        Every page loads Google Tag Manager, container {GTM_ID}, and the Google Ads tag, so Google Ads can measure visits that come from ads. After a request is saved, we send Google a conversion for that submit and the work email address, so the ad can be matched to the enquiry. Telegram, role, countries, and lead volume are not sent to Google. The tag can set a cookie and send Google the page address, the time, and browser details, including the IP address. Google describes that at{" "}
        <a href="https://policies.google.com/privacy">policies.google.com/privacy</a>. Lead records on a desk are not sent through this tag.
      </p>

      <h2>The desk</h2>
      <p>
        A customer operates the desk. TrafficLight supplies the software. The operator decides which affiliates can post, which buyers can receive a lead, and when a conversion is credited.
      </p>
      <p>A lead record on a desk can include:</p>
      <ul>
        <li>name, email, and phone number</li>
        <li>the country taken from the calling code</li>
        <li>the click id, funnel, and affiliate id</li>
        <li>status, payout, and deposit figures</li>
      </ul>
      <p>
        For that lead data, the operator decides why it is collected and where it is sent. TrafficLight stores and routes it so the desk can run. We do not choose the buyer. A first deposit stays uncredited until an operator accepts it.
      </p>
      <p>
        A lead goes to a buyer the operator has set up. A postback goes to the affiliate the operator configured, and it carries the status that affiliate is meant to see. A held deposit goes out as Call Back.
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep sales email while the conversation is open and for as long as we need it for that commercial relationship. Lead records stay on the operator’s desk while the desk is open. Access logs stay for the ordinary security and operation of the server.
      </p>

      <h2>Sharing</h2>
      <p>
        We do not sell personal information collected through this website. Google receives the visit measurement described above. Amazon Bedrock receives the chat message described above. Desk data is shared with the parties the operator has already connected: the buyer who receives the lead, and the affiliate who receives the postback. The site and the desk run on a server we control. We also disclose information when the law requires it.
      </p>

      <h2>Your requests</h2>
      <p>
        Email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to ask what we hold, to correct it, or to delete it. If the record is a lead on an operator’s desk, contact that operator as well. They decide the traffic. We will help where the data sits on the platform we host.
      </p>

      <h2>Children</h2>
      <p>The website and the desk are for businesses. They are not meant for children.</p>

      <h2>Changes</h2>
      <p>When this policy changes, we update this page and the date at the top.</p>
    </LegalPage>
  );
}
