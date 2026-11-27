import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Platform",
  description: "Funnels, lead intake, buyer distribution, conversion review, deals, finance, and reports on the TrafficLight desk.",
};

const modules = [
  {
    id: "clicks",
    index: "01",
    title: "Funnels and clicks",
    body: "Each offer has a funnel code and a landing URL. The public click link carries the affiliate id. The tracker stores the hit, the IP, and the user agent, then redirects with the hit id attached.",
    points: [
      "Unknown or inactive funnel codes are refused.",
      "The same hit id is what the affiliate sends back with the lead.",
      "A repeat of that hit id does not open a second lead.",
    ],
  },
  {
    id: "intake",
    index: "02",
    title: "Lead intake",
    body: "Affiliates post leads with a bearer token that must match their affiliate id. The country comes from the calling code. Email and phone are checked against leads already stored.",
    points: [
      "An optional IP whitelist rejects calls from other addresses.",
      "A missing, unknown, or mismatched token is rejected.",
      "A duplicate email or phone is stored as a duplicate and does not fill a deal cap.",
    ],
  },
  {
    id: "distribution",
    index: "03",
    title: "Distribution",
    body: "A lead moves to a buyer only when that buyer is eligible. Eligibility is the country, the buyer’s UTC working hours, the cap, and a share on the distribution plan. Priority breaks ties.",
    points: [
      "A lead with no open route is parked.",
      "Affiliate accounts can also carry an hourly cap and a daily cap.",
      "Sent volume on a deal counts accepted, registered, first-deposit, and deposit leads.",
    ],
  },
  {
    id: "review",
    index: "04",
    title: "Conversion review",
    body: "Buyer statuses are polled back onto the lead. A first deposit does not credit the affiliate by itself. It waits on the pending queue until an operator accepts or rejects it.",
    points: [
      "While the deposit is pending, the affiliate sees Call Back.",
      "Accept releases the conversion. Reject keeps Call Back unless you set another visible status.",
      "The desk can still tell a rejected deposit from an ordinary callback in its own reports.",
    ],
  },
  {
    id: "deals",
    index: "05",
    title: "Deals",
    body: "A deal is one week, Monday through Sunday, for a country, an affiliate, and a buyer. You set the buy price, the sell price, the model, and the cap.",
    points: [
      "Models are cost per lead, cost per first deposit, or revenue share.",
      "A conversion-rate guarantee scales the amount. It does not change how many leads count as sent.",
      "Billed leads are the sent count, limited by the cap. Amount is billed leads, times the guarantee, times the price, on each side of the deal.",
    ],
  },
  {
    id: "finance",
    index: "06",
    title: "Finance",
    body: "The buyer side is invoiced. The affiliate side is a payout that can be held, released, and then marked paid. Both follow the same week and the same credited leads.",
    points: [
      "A held payout is not treated as paid.",
      "Invoices can be marked paid separately from affiliate payouts.",
      "Request logs keep the calls that created or changed a lead.",
    ],
  },
  {
    id: "reports",
    index: "07",
    title: "Reports and logs",
    body: "Operators read the week by affiliate, buyer, country, and status. Reports can separate a rejected deposit from leads the affiliate still sees as Call Back.",
    points: [
      "Overview counts stay on the operator desk.",
      "High-signal log lines can be reviewed with the lead.",
      "Affiliate tokens can be rotated without changing the affiliate id.",
    ],
  },
];

export default function PlatformPage() {
  return (
    <>
      <section className="page-hero wrap">
        <p className="kicker">Platform</p>
        <h1>What the operator desk keeps.</h1>
        <p className="lede">
          TrafficLight is the system of record for an affiliate team: the click, the lead, the buyer it was sent to, the status that came back, and whether that status was credited.
        </p>
      </section>
      <div className="wrap platform-layout">
        <nav className="platform-index" aria-label="Platform sections">
          {modules.map((item) => (
            <a key={item.id} href={`#${item.id}`}>
              <span>{item.index}</span>
              {item.title}
            </a>
          ))}
        </nav>
        <div className="platform-modules">
          {modules.map((item) => (
            <article key={item.id} id={item.id}>
              <p className="index">{item.index}</p>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <ul>
                {item.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
          <p className="module-end">
            <Link className="btn" href="/request">Book a demo</Link>
          </p>
        </div>
      </div>
    </>
  );
}
