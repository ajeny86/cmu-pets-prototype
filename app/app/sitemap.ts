import type { MetadataRoute } from "next"

import { REPORTS } from "@/lib/lost-pets/db"
import { reportPath } from "@/lib/lost-pets/query"
import { originFromHeaders } from "@/lib/lost-pets/site"

/* The lost & found pages and the public listings feed, so crawlers and AI agents can find them. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const o = await originFromHeaders()
  const now = new Date()
  return [
    { url: `${o}/`, lastModified: now, priority: 1 },
    { url: `${o}/lost-found`, lastModified: now, priority: 0.9 },
    { url: `${o}/lost-found/reports`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${o}/api/pets`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${o}/llms.txt`, lastModified: now, priority: 0.5 },
    ...REPORTS.map((r) => ({ url: `${o}${reportPath(r)}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
  ]
}
