import type { ReactNode } from "react";
import { headers } from "next/headers";
import { IBM_Plex_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { ChatGate } from "@/components/chat-gate";
import { ClickBeacon } from "@/components/click-beacon";
import { Footer } from "@/components/footer";
import { ADS_SNIPPET, GTM_SNIPPETS, GoogleTagNoscript } from "@/components/google-tag";
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const path = (await headers()).get("x-tl-path") || "";
  const privatePage = path === "/report";
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {privatePage ? null : <script async src={`https://www.googletagmanager.com/gtag/js?id=${ADS_ID}`} />}
        {privatePage ? null : <script id="google-ads" dangerouslySetInnerHTML={{ __html: ADS_SNIPPET }} />}
        {privatePage
          ? null
          : GTM_SNIPPETS.map(({ id, html }) => (
              <script key={id} id={`google-tag-manager-${id}`} dangerouslySetInnerHTML={{ __html: html }} />
            ))}
      </head>
      <body className={sans.className}>
        {privatePage ? null : <GoogleTagNoscript />}
        {privatePage ? null : <ClickBeacon />}
        {privatePage ? null : (
          <a className="skip" href="#content">
            Skip to content
          </a>
        )}
        {privatePage ? null : <Header />}
        <main id="content">{children}</main>
        {privatePage ? null : <Footer />}
        {privatePage ? null : <ChatGate />}
      </body>
    </html>
  );
}
