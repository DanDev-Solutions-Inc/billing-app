import { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
  name: "DanDev Billing",
  short_name: "Billing",
  description:
    "Invoices, estimates, receipts, and expense tracking for DanDev Solutions.",
  start_url: "/dashboard",
  display: "standalone",
  background_color: "#f5f6f8",
  theme_color: "#144783",
  icons: [
    { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
    { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    {
      src: "/icon-maskable-512.png",
      sizes: "512x512",
      type: "image/png",
      purpose: "maskable",
    },
  ],
});

export default manifest;
