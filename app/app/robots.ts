import type { MetadataRoute } from "next"

import { originFromHeaders } from "@/lib/lost-pets/site"

/* Search engines and AI agents (ChatGPT, Claude…) may read the whole site; the listings are public demo data. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const o = await originFromHeaders()
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${o}/sitemap.xml`,
  }
}
