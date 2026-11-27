import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/site";
import { Mark } from "./mark";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <Link className="brand" href="/">
            <Mark size={18} />
            <span>TrafficLight</span>
          </Link>
          <p className="footer-note">
            Affiliate tracking and lead distribution. Your team operates the desk. TrafficLight supplies the platform.
          </p>
        </div>
        <div>
          <p className="footer-label">Product</p>
          <ul>
            <li><Link href="/platform">Platform</Link></li>
            <li><Link href="/affiliates">Affiliates</Link></li>
            <li><Link href="/request">Book a demo</Link></li>
          </ul>
        </div>
        <div>
          <p className="footer-label">Legal</p>
          <ul>
            <li><Link href="/privacy">Privacy policy</Link></li>
            <li><Link href="/terms">Terms and conditions</Link></li>
          </ul>
        </div>
        <div>
          <p className="footer-label">Contact</p>
          <ul>
            <li><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li>
          </ul>
        </div>
      </div>
      <div className="wrap footer-end">
        <p>trafficlight.gg</p>
        <p>Click, lead, route, review, payout.</p>
      </div>
    </footer>
  );
}
