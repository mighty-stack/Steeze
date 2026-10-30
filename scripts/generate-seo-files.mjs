import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteUrl = process.env.VITE_SITE_URL;

if (!siteUrl) {
  throw new Error(
    'VITE_SITE_URL is required to generate production SEO files. Set it to the full HTTPS origin without a trailing slash (for example, https://www.cloutlabs.name.ng).',
  );
}

let parsedSiteUrl;
try {
  parsedSiteUrl = new URL(siteUrl);
} catch {
  throw new Error(
    'VITE_SITE_URL must be a full HTTPS origin without a trailing slash (for example, https://www.cloutlabs.name.ng).',
  );
}

if (parsedSiteUrl.protocol !== 'https:' || parsedSiteUrl.origin !== siteUrl) {
  throw new Error(
    'VITE_SITE_URL must be a full HTTPS origin without a trailing slash (for example, https://www.cloutlabs.name.ng).',
  );
}

const publicDir = resolve(dirname(fileURLToPath(import.meta.url)), '../public');
const lastmod = new Date().toISOString().slice(0, 10);
const publicPaths = ['/', '/register/brand', '/register/creator'];
const sitemapUrls = publicPaths
  .map((path) => `  <url>\n    <loc>${siteUrl}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
  .join('\n');

await mkdir(publicDir, { recursive: true });
await Promise.all([
  writeFile(
    resolve(publicDir, 'robots.txt'),
    `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`,
    'utf8',
  ),
  writeFile(
    resolve(publicDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`,
    'utf8',
  ),
]);
