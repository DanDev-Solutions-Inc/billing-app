import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* The client cache for dynamic pages defaults to 0s in v15+ — every
     back/forward between nav items was a fresh server round-trip. 30s keeps a
     just-visited page instant without letting the ledger go stale. `static`
     stays at its 5-minute default. */
  experimental: {
    staleTimes: {
      dynamic: 30,
    },
  },
  /* Team management moved into Settings — keep old links and bookmarks working. */
  redirects: async () => [
    { source: "/team", destination: "/settings", permanent: true },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;
