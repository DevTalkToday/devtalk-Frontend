import type { Metadata } from "next";
import { getAdsenseAccountMeta } from "@/lib/adsense/config";
import { getGoogleSiteVerification, getSiteUrl } from "@/lib/site/config";
import { Providers } from "./providers";
import "./globals.css";

const adsenseAccount = getAdsenseAccountMeta();
const siteUrl = getSiteUrl();
const googleSiteVerification = getGoogleSiteVerification();

export const metadata: Metadata = {
  title: "Devtalk",
  description: "Developer communication platform",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: googleSiteVerification
    ? {
        google: googleSiteVerification,
      }
    : undefined,
  other: {
    "google-adsense-account": adsenseAccount,
  },
  icons: {
    icon: "/DevTalk.svg",
    shortcut: "/DevTalk.svg",
    apple: "/DevTalk.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var saved=localStorage.getItem("devtalk-theme");var theme=(saved==="dark"||saved==="light")?saved:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.dataset.theme=theme;}catch(e){document.documentElement.dataset.theme="dark";}})();`,
          }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
