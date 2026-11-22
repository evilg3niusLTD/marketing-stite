import Link from "next/link";

const jobs = [
  {
    index: "01",
    title: "Track",
    body: "A funnel link records the click, the affiliate, and a hit id, then redirects to the landing page.",
  },
  {
    index: "02",
    title: "Route",
    body: "The intake API takes the lead. The desk sends it to an eligible buyer for that country, hour, cap, and plan.",
  },
  {
    index: "03",
    title: "Settle",
    body: "Registrations and deposits come back onto the lead. A first deposit can wait until you accept it.",
  },
];

const sides = [
  {
    title: "Operator",
    body: "You run the desk. Affiliates, funnels, buyers, weekly deals, caps, and the review queue are yours.",
  },
  {
    title: "Affiliate",
    body: "Partners get an id, an API token, a click link, and a postback. They see Call Back while a deposit is held.",
  },
  {
    title: "Buyer",
    body: "A buyer receives a lead when the route selects them. Country, working hours, priority, and caps decide eligibility.",
  },
];

const modules = [
  ["Clicks", "Funnel links with an affiliate id and a stored hit id.", "/platform#clicks"],
  ["Intake", "Token auth, an optional IP whitelist, and one lead per hit id.", "/platform#intake"],
  ["Distribution", "Country, buyer hours, priority, caps, and the distribution plan.", "/platform#distribution"],
  ["Review", "A first deposit waits. Accept credits it. Reject stays on Call Back.", "/platform#review"],
  ["Deals", "Monday to Sunday, one country, CPL or CPA, prices, a cap, and an optional guarantee.", "/platform#deals"],
  ["Finance", "Buyer invoices and affiliate payouts, from hold to paid.", "/platform#finance"],
];

const steps = [
  "The visitor hits a funnel link carrying the affiliate id.",
  "The tracker stores the click and a hit id, then redirects to the landing page.",
  "The affiliate posts the lead with that hit id and their API token.",
  "The desk checks the token, the country, and whether the email or phone is already stored.",
  "An eligible buyer receives the lead.",
  "Later statuses return. A first deposit can sit in review before anyone is credited.",
];

const questions = [
  {
    q: "What does TrafficLight supply?",
    a: "The tracking and distribution platform. Your team operates affiliates, buyers, funnels, and deals on that desk. Buyers and offers stay on the operator’s side.",
  },
  {
    q: "What gets recorded?",
    a: "Clicks, lead posts, and later statuses: accepted, rejected, duplicate, registered, parked, first deposit, and a later deposit. The status an affiliate sees can differ from the one on the operator desk.",
  },
  {
    q: "Why would a deposit show as Call Back?",
    a: "A new deposit waits for an operator decision. Until it is accepted, the affiliate sees Call Back. A rejected deposit stays on Call Back unless an operator sets another visible status.",
  },
  {
    q: "How is a deal counted?",
    a: "Deals run Monday to Sunday, for one country, one affiliate, and one buyer. Sent leads are accepted, registered, first-deposit, or later-deposit leads. Duplicates do not fill the cap. Billed volume is the sent count, limited by the cap.",
  },
  {
    q: "How does an affiliate connect?",
    a: "Each affiliate has a numeric id, an API token, an optional IP whitelist, hourly and daily caps, and a postback URL. The click link is the funnel code plus that affiliate id.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero wrap">
        <div className="hero-copy">
          <p className="kicker">Affiliate tracking platform</p>
          <h1>Affiliate tracking, built as a desk.</h1>
          <p className="lede">
            TrafficLight supplies the platform your team operates. It records the click, accepts the lead, sends it to a buyer you choose, and holds a conversion until you credit it.
          </p>
          <div className="hero-actions">
            <Link className="btn" href="/request">
              Request a desk
            </Link>
            <Link className="btn btn-ghost" href="/platform">
              See the platform
            </Link>
          </div>
        </div>
        <div className="stage">
        <aside className="slip" aria-label="Illustrative route, not live traffic">
          <div className="slip-top">
            <span>Sample route</span>
            <span>Illustrative</span>
          </div>
          <ol className="lamps">
            <li><span className="lamp lamp-green" />Click stored</li>
            <li><span className="lamp lamp-green" />Lead accepted</li>
            <li><span className="lamp lamp-amber" />First deposit held</li>
            <li><span className="lamp lamp-red" />Not credited yet</li>
          </ol>
          <dl className="slip-rows">
            <div><dt>Funnel</dt><dd>eu-fx</dd></div>
            <div><dt>Affiliate</dt><dd>1042</dd></div>
            <div><dt>Country</dt><dd>GB</dd></div>
            <div><dt>Model</dt><dd>CPA</dd></div>
            <div><dt>Week cap</dt><dd>40</dd></div>
            <div><dt>Buyer</dt><dd>Next eligible</dd></div>
          </dl>
          <p className="slip-foot">A first deposit stays uncredited until an operator accepts it. The affiliate sees Call Back during that hold.</p>
        </aside>
        </div>
      </section>

      <section className="wrap jobs" aria-label="What the desk does">
        {jobs.map((job) => (
          <article key={job.index}>
            <p className="index">{job.index}</p>
            <h2>{job.title}</h2>
            <p>{job.body}</p>
          </article>
        ))}
      </section>

      <section className="band">
        <div className="wrap">
          <div className="section-head">
            <p className="kicker">From click to payout</p>
            <h2>One lead, six recorded steps.</h2>
          </div>
          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <p className="kicker">On the desk</p>
          <h2>The parts an operator actually uses.</h2>
        </div>
        <div className="module-grid">
          {modules.map(([title, body, href]) => (
            <Link key={title} href={href} className="module-card">
              <h3>{title}</h3>
              <p>{body}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <p className="kicker">Three sides</p>
          <h2>You operate it. Partners post. Buyers receive.</h2>
        </div>
        <div className="jobs sides">
          {sides.map((side) => (
            <article key={side.title}>
              <h3>{side.title}</h3>
              <p>{side.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="section-head">
          <p className="kicker">Questions</p>
          <h2>What the platform does, and what it leaves to you.</h2>
        </div>
        <div className="faq">
          {questions.map((item) => (
            <details key={item.q}>
              <summary>
                {item.q}
                <span className="plus" aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="wrap">
        <div className="cta-band">
          <div>
            <p className="kicker">trafficlight.gg</p>
            <h2>Request a desk for your team.</h2>
            <p>Tell us the countries, the volume, and who posts the traffic. We reply by email.</p>
          </div>
          <Link className="btn btn-light" href="/request">
            Request a desk
          </Link>
        </div>
      </section>
    </>
  );
}
