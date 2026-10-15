/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["exceljs", "@prisma/client", "@prisma/adapter-pg", "pg"],
  experimental: { serverActions: { bodySizeLimit: "30mb" } },
};
export default nextConfig;
