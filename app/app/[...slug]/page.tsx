import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ComingSoon } from "@/components/buddy/coming-soon"

/* Screens that the Home tiles, Lost & Found cards and tab bar link to, but that are not built yet.
   Each one shows a "Coming soon" page instead of a 404. Any other address is a real 404. */
const screens: Record<string, { title: string; lede?: string; back?: { href: string; label: string } }> = {
  "lost-found/lost": {
    title: "Report a lost pet",
    lede: "Add a photo, and I’ll recognise key details. You can then add the rest by voice or text.",
    back: { href: "/lost-found", label: "Lost & Found" },
  },
  "lost-found/found": {
    title: "I found a pet",
    lede: "Snap a photo — AI fills in the report for you.",
    back: { href: "/lost-found", label: "Lost & Found" },
  },
  chat: {
    title: "Chat with Clue",
    lede: "Ask the AI Guide anything.",
    back: { href: "/lost-found", label: "Lost & Found" },
  },
  adoption: { title: "Adoption", lede: "Find a friend." },
  services: { title: "Services & Care", lede: "Vets & grooming near you." },
  shop: { title: "Shop", lede: "Pet essentials." },
  pets: { title: "My pets", lede: "Your pets’ profiles, reports and reminders." },
  profile: { title: "Profile", lede: "Your account and contact details." },
  settings: { title: "Settings", lede: "Notifications, privacy and language." },
  signup: { title: "Create account", lede: "Save your pets and get alerts when someone finds them." },
}

export const dynamicParams = false

export function generateStaticParams() {
  return Object.keys(screens).map((path) => ({ slug: path.split("/") }))
}

type Props = { params: Promise<{ slug: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const screen = screens[(await params).slug.join("/")]
  return { title: screen ? `${screen.title} · buddy` : "buddy" }
}

export default async function ComingSoonPage({ params }: Props) {
  const screen = screens[(await params).slug.join("/")]
  if (!screen) notFound()
  return <ComingSoon {...screen} />
}
