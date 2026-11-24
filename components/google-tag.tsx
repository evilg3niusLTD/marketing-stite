import { ADS_ID, GTM_IDS } from "@/lib/site";

export const ADS_SNIPPET = `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ADS_ID}');`;

/** Official container bootstrap. A bare gtm.js src does not record gtm.start. */
export function gtmSnippet(id: string) {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${id}');`;
}

export const GTM_SNIPPETS = GTM_IDS.map((id) => ({ id, html: gtmSnippet(id) }));

export function GoogleTagNoscript() {
  return (
    <>
      {GTM_IDS.map((id) => (
        <noscript key={id}>
          <iframe
            src={`https://www.googletagmanager.com/ns.html?id=${id}`}
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
            title="Google Tag Manager"
          />
        </noscript>
      ))}
    </>
  );
}
