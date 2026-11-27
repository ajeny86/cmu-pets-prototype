"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import {
  HomeIcon,
  PawIcon,
  PlusIcon,
  ProfileIcon,
  SettingsIcon,
} from "@/components/buddy/icons"

const tabs = [
  { href: "/", label: "Home", Icon: HomeIcon },
  { href: "/pets", label: "My pets", Icon: PawIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
] as const

type TabBarProps = React.ComponentProps<"nav"> & {
  /** Signed-in members get four flat tabs: no "Create account" FAB. */
  member?: boolean
  /** Render in place (design-system page) instead of pinned to the viewport bottom. */
  inline?: boolean
}

/** Tab bar (Figma: "5 tabs + pink FAB"). White bar with a notch for the raised pink button. */
export function TabBar({ member = false, inline = false, className, ...props }: TabBarProps) {
  const pathname = usePathname()
  const items = member ? tabs : [tabs[0], tabs[1], null, tabs[2], tabs[3]]

  return (
    <nav
      aria-label="Main"
      className={cn(
        "z-20 h-[calc(92px+env(safe-area-inset-bottom))] w-full max-w-[393px]",
        inline ? "relative" : "fixed bottom-0 left-1/2 -translate-x-1/2",
        className
      )}
      {...props}
    >
      <svg
        className="absolute inset-x-0 top-0 h-[92px] w-full drop-shadow-[0_-3px_10px_rgb(16_40_139/0.07)]"
        viewBox="0 0 393 92"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="#fff"
          d={
            member
              ? "M0 20 Q0 6 14 6 H379 Q393 6 393 20 V92 H0 Z"
              : "M0 20 Q0 6 14 6 H148 C165 6 167 34 196.5 34 C226 34 228 6 245 6 H379 Q393 6 393 20 V92 H0 Z"
          }
        />
      </svg>
      <div className="absolute inset-x-0 top-[91px] bottom-0 bg-white" />

      {!member && (
        <Link
          href="/signup"
          aria-label="Create account"
          className="absolute top-[-22px] left-1/2 z-10 -ml-[27px] grid size-[54px] place-items-center rounded-full bg-pink text-white shadow-[0_8px_18px_rgb(243_124_255/0.45)] transition-[filter] hover:brightness-105"
        >
          <PlusIcon />
        </Link>
      )}

      <div
        className={cn(
          "absolute inset-x-2.5 top-4 z-10 grid text-center",
          member ? "grid-cols-4" : "grid-cols-5"
        )}
      >
        {items.map((tab) =>
          tab === null ? (
            <span
              key="plus"
              className="flex flex-col items-center justify-end pt-[38px] text-[11px] font-semibold tracking-[-0.2px] whitespace-nowrap text-pink-ink"
            >
              Create account
            </span>
          ) : (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={pathname === tab.href ? "page" : undefined}
              className="group flex flex-col items-center gap-1 text-[11px] font-semibold text-tab-ink aria-[current=page]:text-navy"
            >
              <span className="grid h-[30px] w-[52px] place-items-center rounded-[15px] opacity-80 group-aria-[current=page]:bg-tab-active group-aria-[current=page]:opacity-100">
                <tab.Icon />
              </span>
              {tab.label}
            </Link>
          )
        )}
      </div>
    </nav>
  )
}
