"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { isMember, useBuddy } from "@/lib/store"
import { AccountButton } from "@/components/buddy/app-header"
import { BellIcon, PlusIcon } from "@/components/buddy/icons"

const links = [
  { href: "/", label: "Home" },
  { href: "/lost-found", label: "Lost & Found" },
  { href: "/adoption", label: "Adoption" },
  { href: "/services", label: "Services & Care" },
  { href: "/shop", label: "Shop" },
  { href: "/pets", label: "My pets" },
]

const active = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"))

/** Desktop navigation (md and up). Replaces the bottom tab bar on wide screens. */
export function TopNav() {
  const path = usePathname()
  const s = useBuddy()
  const member = isMember(s)
  const cartCount = Object.values(s.cart).reduce((a, b) => a + b, 0)
  return (
    <header className="sticky top-0 z-30 hidden border-b border-white/60 bg-white/80 backdrop-blur-md md:block">
      <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-6 px-8">
        <Link href="/" aria-label="buddy home" className="shrink-0">
          <Image src="/assets/buddy-wordmark-green.svg" alt="buddy" width={101} height={32} priority />
        </Link>
        <nav aria-label="Main" className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={active(path, l.href) ? "page" : undefined}
              className="rounded-full px-3 py-2 text-sm font-semibold whitespace-nowrap text-tab-ink transition-colors hover:bg-tint hover:text-navy aria-[current=page]:bg-tab-active aria-[current=page]:text-navy"
            >
              {l.label}
              {l.href === "/shop" && cartCount > 0 && (
                <span className="ml-1.5 rounded-full bg-navy px-1.5 py-px text-[11px] text-white">{cartCount}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/chat"
            className="hidden rounded-full bg-topic-pink px-3.5 py-2 text-sm font-bold text-pink-ink transition-[filter] hover:brightness-95 lg:inline-block"
          >
            ✧ Ask Clue
          </Link>
          <Link href="/pets" aria-label="Notifications" className="grid place-items-center rounded-full transition-opacity hover:opacity-80">
            <BellIcon />
          </Link>
          {member ? (
            <AccountButton />
          ) : (
            <Link
              href="/signup"
              className="flex items-center gap-1.5 rounded-full bg-pink py-2 pr-4 pl-2.5 text-sm font-bold text-white shadow-[0_6px_14px_rgb(243_124_255/0.4)] transition-[filter] hover:brightness-105 [&_svg]:size-5"
            >
              <PlusIcon />
              Create account
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export function NavLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={cn("font-semibold text-navy underline-offset-2 hover:underline", className)}>
      {children}
    </Link>
  )
}
