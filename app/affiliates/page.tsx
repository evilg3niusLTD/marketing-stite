import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Affiliates",
  description: "How an affiliate connects to a TrafficLight desk: click link, API token, lead post, statuses, and postbacks.",
};

const fields = [
  ["affid", "The affiliate id. It has to match the API token."],
  ["funnel", "The funnel or campaign code the operator opened."],
  ["hitid", "The click id, when the traffic came through the tracker. Reusing it does not create a second lead."],
  ["first_name, last_name", "The lead’s name."],
  ["email", "Stored in lowercase. A repeated email is a duplicate."],
  ["area_code, phone", "Calling code and national number, sent separately. The country is taken from the calling code."],
];

const statuses = [
  ["Accepted", "A buyer accepted the lead."],
  ["Registered", "The buyer later reports a registration."],
  ["Duplicate", "The email or phone was already stored. It does not fill the cap."],
  ["Call Back", "What the affiliate sees while a first deposit waits, and after a rejected deposit, unless another visible status is set."],
  ["First deposit", "Credited only after an operator accepts it."],
  ["Deposit", "A later deposit reported against the same lead."],
];

export default function AffiliatesPage() {
  return (
    <>
      <section className="page-hero wrap">
        <p className="kicker">Affiliates</p>
        <h1>Partners post traffic. The desk answers with a status.</h1>
        <p className="lede">
          An affiliate does not configure buyers. They receive an id, a token, a click link, and a postback. The operator decides where a lead goes and when a conversion is credited.
        </p>
      </section>

      <section className="wrap section split">
        <div>
          <p className="index">01</p>
          <h2>Access</h2>
          <p>
            Each affiliate account has a numeric id and a token. Calls send the token as a bearer credential. If an IP whitelist is set, only those addresses can post. The token can be rotated without changing the id.
          </p>
        </div>
        <div className="code-block" aria-label="Example click link">
          <p>Click link</p>
          <code>/r/eu-fx?affid=1042</code>
          <p>The path is the funnel code. The query is the affiliate id. The tracker adds the hit id on the way to the landing page.</p>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <p className="index">02</p>
          <h2>Lead post</h2>
          <p>The lead is posted in the body, with the bearer token. These are the fields the desk reads.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">What it is</th>
              </tr>
            </thead>
            <tbody>
              {fields.map(([field, detail]) => (
                <tr key={field}>
                  <th scope="row">{field}</th>
                  <td>{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <p className="index">03</p>
          <h2>Statuses an affiliate can see</h2>
          <p>The operator desk keeps a fuller history. These are the outcomes that matter on the affiliate side.</p>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Status</th>
                <th scope="col">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map(([status, detail]) => (
                <tr key={status}>
                  <th scope="row">{status}</th>
                  <td>{detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="wrap section split">
        <div>
          <p className="index">04</p>
          <h2>Postback</h2>
          <p>
            A postback URL on the affiliate can include the hit id, the visible status, the payout, the deposit amount, and the lead id. The visible status follows what the affiliate is meant to see, so a held deposit goes out as Call Back.
          </p>
          <p>Hourly and daily caps, when set, limit how much that affiliate can send. They do not choose the buyer.</p>
        </div>
        <ul className="token-list">
          <li><code>{"{hitid}"}</code><span>Click id</span></li>
          <li><code>{"{status}"}</code><span>Visible status</span></li>
          <li><code>{"{payout}"}</code><span>Affiliate payout</span></li>
          <li><code>{"{deposit}"}</code><span>Deposit amount</span></li>
          <li><code>{"{lead_id}"}</code><span>Lead id</span></li>
        </ul>
      </section>

      <section className="wrap">
        <div className="cta-band">
          <div>
            <h2>Bring your own affiliates, or join a desk as one.</h2>
            <p>Say which side you are on and we will answer from the TrafficLight address.</p>
          </div>
          <Link className="btn btn-light" href="/request">Book a demo</Link>
        </div>
      </section>
    </>
  );
}
