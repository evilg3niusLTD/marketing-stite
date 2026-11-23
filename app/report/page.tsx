import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { loadVisitReport, nicosiaTime, passwordMatches, reportToken } from "@/lib/report";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Visits",
  robots: { index: false, follow: false },
};

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  const password = process.env.REPORT_PASSWORD || "";
  if (!password) notFound();
  const jar = await cookies();
  const open = jar.get("tl_report")?.value === reportToken(password);
  if (!open) {
    const query = await searchParams;
    return <Login failed={query.e === "1"} />;
  }
  const report = await loadVisitReport();
  return (
    <section className="page-hero wrap report-page">
      <div>
        <p className="kicker">Visits</p>
        <h1>Google, Bing, and Telegram.</h1>
        <p className="lede">Counts are the last 7 days. Today follows Asia/Nicosia. A lead is a saved desk request from that visit.</p>
      </div>
      <div className="report-grid">
        {report.counts.map((item) => (
          <article key={item.name} className="report-card">
            <h2>{item.name}</h2>
            <p>
              <strong>{item.clicks}</strong> clicks
            </p>
            <p>
              <strong>{item.leads}</strong> leads
            </p>
            <span>
              Today {item.clicksToday} clicks, {item.leadsToday} leads
            </span>
          </article>
        ))}
      </div>
      <div className="report-table-wrap">
        <h2>Recent leads</h2>
        {report.leads.length === 0 ? <p className="lede">No saved requests yet.</p> : null}
        {report.leads.length > 0 ? (
          <table className="report-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Source</th>
                <th>Campaign</th>
                <th>Keyword</th>
                <th>Email</th>
                <th>Role</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {report.leads.map((lead) => (
                <tr key={`${lead.at}-${lead.email}`}>
                  <td>{nicosiaTime(lead.at)}</td>
                  <td>{lead.media}</td>
                  <td>{lead.campaign}</td>
                  <td>{lead.keyword}</td>
                  <td>{lead.email}</td>
                  <td>{lead.role}</td>
                  <td>{lead.country}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </div>
    </section>
  );
}

function Login({ failed }: { failed: boolean }) {
  return (
    <section className="page-hero wrap report-page">
      <div>
        <p className="kicker">Visits</p>
        <h1>Open the visit report.</h1>
      </div>
      <form className="report-login" action={enter}>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn" type="submit">
          Open
        </button>
        {failed ? <p role="alert">That password is not right.</p> : null}
      </form>
    </section>
  );
}

async function enter(formData: FormData) {
  "use server";
  const password = process.env.REPORT_PASSWORD || "";
  const given = String(formData.get("password") || "");
  if (!password || !passwordMatches(given, password)) redirect("/report?e=1");
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
