import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Devtalk",
  description: "Developer communication platform",
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
