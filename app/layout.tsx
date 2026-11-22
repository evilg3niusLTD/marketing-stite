import type { ReactNode } from "react";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ChatGate } from "@/components/chat-gate";
import { ClickBeacon } from "@/components/click-beacon";
import { Footer } from "@/components/footer";
import { ADS_SNIPPET, GTM_SNIPPET, GoogleTagNoscript } from "@/components/google-tag";
import { ADS_ID } from "@/lib/site";
import { Header } from "@/components/header";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata = {
  metadataBase: new URL("https://trafficlight.gg"),
  title: {
    default: "TrafficLight — Affiliate tracking and lead distribution",
    template: "%s · TrafficLight",
  },
  description:
    "TrafficLight supplies the affiliate tracking desk. Record the click, accept the lead, route it to a buyer you choose, and hold a conversion until you credit it.",
  openGraph: {
    title: "TrafficLight — Affiliate tracking and lead distribution",
    description: "Click tracking, lead intake, buyer routing, conversion review, and payouts on one operator desk.",
    url: "https://trafficlight.gg",
    siteName: "TrafficLight",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`} />
        <script id="google-ads" dangerouslySetInnerHTML={{ __html: ADS_SNIPPET }} />
        <script id="google-tag-manager" dangerouslySetInnerHTML={{ __html: GTM_SNIPPET }} />
      </head>
      <body className={sans.className}>
        <GoogleTagNoscript />
        <ClickBeacon />
        <a className="skip" href="#content">
          Skip to content
        </a>
        <Header />
        <main id="content">{children}</main>
        <Footer />
        <ChatGate />
      </body>
    </html>
  );
}
