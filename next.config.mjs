/** Export estático: se publica en cualquier hosting (GitHub Pages, Vercel, Cloudflare). */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
export default {
  output: 'export',
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
};
