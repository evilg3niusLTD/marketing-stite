import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { filterClicks, loadVisitReport, loginState, nicosiaTime, passwordMatches, recordLoginFailure, recordLoginSuccess, reportToken, visitQuery, type ClickDetail } from "@/lib/report";
import { clientAddress } from "@/lib/visitor";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Visits",
  robots: { index: false, follow: false },
};

export default async function ReportPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const password = process.env.REPORT_PASSWORD || "";
  if (!password) notFound();
  const jar = await cookies();
  const open = jar.get("tl_report")?.value === reportToken(password);
  const params = await searchParams;
  if (!open) return <Login failed={params.e === "1"} locked={params.e === "2"} />;
  const query = visitQuery(params);
  const report = await loadVisitReport();
  const clicks = filterClicks(report.clicks, query, new Date());
  const leads = filterClicks(report.leads, query, new Date());
  const shown = clicks.slice(0, 300);
  const countries = [...new Set(report.clicks.map((click) => click.country).filter(Boolean))].sort();
  return (
    <section className="page-hero wrap report-page">
      <div className="report-head">
        <div>
          <p className="kicker">Visits</p>
          <h1>Clicks</h1>
          <p className="lede">Each row is one saved visit. Times follow Asia/Nicosia. This page is not part of the public site.</p>
        </div>
        <form action={leave}>
          <button className="report-logout" type="submit">
            Log out
          </button>
        </form>
      </div>
      <form className="report-filters" action="/report">
        <label>
          Source
          <select name="media" defaultValue={query.media}>
            <option value="">All</option>
            <option>Google</option>
            <option>Bing</option>
            <option>Telegram</option>
            <option>Direct</option>
            <option>Other</option>
          </select>
        </label>
        <label>
          Country
          <select name="country" defaultValue={query.country}>
            <option value="">All</option>
            {countries.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
        </label>
        <label>
          When
          <select name="range" defaultValue={query.range}>
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All saved</option>
          </select>
        </label>
        <label>
          Search
          <input name="q" defaultValue={query.q} placeholder="Campaign, keyword, IP" />
        </label>
        <button className="btn" type="submit">
          Filter
        </button>
      </form>
      <p className="report-count">
        {shown.length === clicks.length ? `${clicks.length} clicks` : `Showing ${shown.length} of ${clicks.length} clicks`}
        {leads.length === 1 ? " · 1 lead" : ` · ${leads.length} leads`}
      </p>
      <ClickTable rows={shown} />
      <div className="report-table-wrap">
        <h2>Leads</h2>
        {leads.length === 0 ? <p className="lede">No saved requests for this filter.</p> : null}
        {leads.length > 0 ? (
          <table className="report-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Source</th>
                <th>Email</th>
                <th>Role</th>
                <th>Telegram</th>
                <th>Countries</th>
                <th>Volume</th>
                <th>Campaign</th>
                <th>Keyword</th>
                <th>Country</th>
                <th>IP</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {leads.slice(0, 100).map((lead) => (
                <tr key={`${lead.at}-${lead.email}`}>
                  <td>{nicosiaTime(lead.at)}</td>
                  <td>{lead.media}</td>
                  <td>{lead.email}</td>
                  <td>{lead.role}</td>
                  <td>{lead.telegram}</td>
                  <td>{lead.countries}</td>
                  <td>{lead.volume}</td>
                  <td>{lead.campaign}</td>
                  <td>{lead.keyword}</td>
                  <td>{lead.country}</td>
                  <td>{lead.ip}</td>
                  <td>{lead.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}

function ClickTable({ rows }: { rows: ClickDetail[] }) {
  if (rows.length === 0) return <p className="lede">No clicks for this filter.</p>;
  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Source</th>
            <th>Page</th>
            <th>Country</th>
            <th>IP</th>
            <th>Device</th>
            <th>System</th>
            <th>Browser</th>
            <th>Campaign</th>
            <th>Keyword</th>
            <th>Match</th>
            <th>Network</th>
            <th>Ad group</th>
            <th>Placement</th>
            <th>From</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((click, index) => (
            <tr key={`${click.at}-${click.ip}-${index}`}>
              <td>{nicosiaTime(click.at)}</td>
              <td>{click.media}</td>
              <td>{click.page}</td>
              <td>{click.country}</td>
              <td>{click.ip}</td>
              <td>{click.device}</td>
              <td>{click.system}</td>
              <td>{click.browser}</td>
              <td>{click.campaign}</td>
              <td>{click.keyword}</td>
              <td>{click.match}</td>
              <td>{click.network}</td>
              <td>{click.adGroup}</td>
              <td>{click.placement}</td>
              <td>{click.referrer}</td>
              <td>{click.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Login({ failed, locked }: { failed: boolean; locked: boolean }) {
  return (
    <section className="page-hero wrap report-page">
      <div>
        <p className="kicker">Visits</p>
        <h1>Open the visit report.</h1>
      </div>
      <form className="report-login" action={enter}>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" maxLength={200} required />
        </label>
        <button className="btn" type="submit">
          Open
        </button>
        {locked ? <p role="alert">Too many tries. Wait 15 minutes.</p> : null}
        {failed && !locked ? <p role="alert">That password is not right.</p> : null}
      </form>
    </section>
  );
}

async function leave() {
  "use server";
  const jar = await cookies();
  jar.set("tl_report", "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/report",
    maxAge: 0,
  });
  redirect("/report");
}

async function enter(formData: FormData) {
  "use server";
  const headerList = await headers();
  const ip = clientAddress(headerList) || "unknown";
  const now = Date.now();
  if (loginState(ip, now) === "locked") redirect("/report?e=2");
  const password = process.env.REPORT_PASSWORD || "";
  const given = String(formData.get("password") || "").slice(0, 200);
  if (!password || !passwordMatches(given, password)) {
    const result = recordLoginFailure(ip, now);
    redirect(result === "locked" ? "/report?e=2" : "/report?e=1");
  }
  recordLoginSuccess(ip);
  const jar = await cookies();
  jar.set("tl_report", reportToken(password), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/report",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/report");
}
