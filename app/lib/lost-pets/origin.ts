/** The site's public address for links in AI answers: SITE_URL if set, else the address the request came to. */
export function siteOrigin(request: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "")
  const url = new URL(request.url)
  const host = request.headers.get("x-forwarded-host") ?? url.host
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "")
  return `${proto}://${host}`
}

/** Lets AI tools and browsers on other sites read the API (it's public demo data, read-only). */
export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id, Mcp-Protocol-Version",
}
