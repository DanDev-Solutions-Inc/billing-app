import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { PwaRegister } from "@components/pwa-register";
import "./globals.css";

// Free fallbacks for the Adobe brand fonts until the Typekit kit loads:
// Inter Tight ≈ Neue Haas Grotesk Display (headings), Inter ≈ Neue Haas
// Grotesk Text (body). The CSS stacks in globals.css prefer the Adobe families.
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "DanDev Billing",
    template: "%s · DanDev Billing",
  },
  description:
    "Invoices, estimates, receipts, and expense tracking for DanDev Solutions.",
  applicationName: "DanDev Billing",
  appleWebApp: {
    capable: true,
    title: "DanDev Billing",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#144783",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // DanDev brand fonts via Adobe Fonts (Typekit) web project. Set the kit id in
  // ADOBE_FONTS_KIT_ID and globals.css picks the families up automatically
  // (the heading/body stacks already list the Adobe slugs first).
  const adobeKit = process.env.ADOBE_FONTS_KIT_ID;

  return (
    <html
      lang="en"
      className={`${interTight.variable} ${inter.variable} h-full antialiased`}
    >
      {/* Extensions (Grammarly, wallets) inject attributes onto <body> before
          React hydrates — `data-gr-ext-installed`, `data-new-gr-c-s-check-loaded`
          — which React reports as a hydration mismatch. Suppressing it here is
          scoped to this element's own attributes: children are still checked,
          so a real mismatch inside the app still surfaces. */}
      <body className="min-h-full" suppressHydrationWarning>
        {adobeKit && (
          <link
            rel="stylesheet"
            href={`https://use.typekit.net/${adobeKit}.css`}
            precedence="high"
          />
        )}
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
