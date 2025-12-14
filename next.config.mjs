/** @type {import('next').NextConfig} */
const nextConfig = {
  // 간단하고 표준적인 설정으로 복귀
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "supa.gl",
      },
      {
        protocol: "https",
        hostname: "mbldqbzucgynrlhutfda.supabase.co",
      },
      {
        protocol: "https",
        hostname: "bdwkuoypxcncyrvgyswl.supabase.co",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
