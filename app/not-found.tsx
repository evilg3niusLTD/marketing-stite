import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-hero wrap">
      <p className="kicker">404</p>
      <h1>That page is not on this site.</h1>
      <p className="lede">The desk pages are the platform, the affiliate notes, and the request form.</p>
      <p className="module-end">
        <Link className="btn" href="/">Back home</Link>
      </p>
    </section>
  );
}
