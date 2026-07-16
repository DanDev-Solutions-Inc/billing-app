import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { PwaRegister } from "@components/pwa-register";
import "./globals.css";

// Free stand-ins for the licensed brand fonts: Inter Tight ≈ Neue Haas
// Grotesk Display Pro (headings), Inter ≈ Söhne (body). The CSS stacks in
// globals.css still prefer the real fonts when installed.
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
  return (
    <html
      lang="en"
      className={`${interTight.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
