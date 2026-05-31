/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disabled StrictMode to prevent double execution of useEffect in dev/production
  // which caused page views to be counted twice.
  reactStrictMode: false,
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.feishucdn.com" },
      { protocol: "https", hostname: "**.larksuitecdn.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
