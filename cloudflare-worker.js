/**
 * Isle of Man Government News — Cloudflare Worker
 *
 * Supports two sources via the `site` query parameter:
 *   site=gov   (default) — https://www.gov.im
 *   site=dfe           — https://www.iomdfenterprise.im
 *
 * Pass the path via the `path` query parameter, e.g.:
 *   ?site=gov&path=/news/2024/
 *   ?site=dfe&path=/news-events/?page=2
 *
 * SETUP: Paste this into your Cloudflare Worker and redeploy.
 */

const SITES = {
  gov: {
    base: 'https://www.gov.im',
    referer: 'https://www.gov.im/news/',
    defaultPath: '/news/RssNews',
  },
  dfe: {
    base: 'https://www.iomdfenterprise.im',
    referer: 'https://www.iomdfenterprise.im/news-events/',
    defaultPath: '/news-events/',
  },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const siteKey = url.searchParams.get('site') || 'gov';
    const site = SITES[siteKey];

    if (!site) {
      return json({ error: `Unknown site: ${siteKey}` }, 400);
    }

    const path = url.searchParams.get('path') || site.defaultPath;
    const target = site.base + path;

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-GB,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': site.referer,
      'Cache-Control': 'no-cache',
    };

    try {
      const response = await fetch(target, { headers });

      if (!response.ok) {
        return json({ error: `${siteKey} returned HTTP ${response.status}` }, response.status);
      }

      const text = await response.text();

      return new Response(text, {
        status: 200,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'text/html',
          'Cache-Control': 'public, max-age=3600',
          ...CORS
        }
      });

    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS }
  });
}
