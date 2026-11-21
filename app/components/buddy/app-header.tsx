import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { BellIcon } from "@/components/buddy/icons"

/** Round avatar button: periwinkle disc with the person glyph, white ring (prototype `.avatar`). */
export function AccountButton({ className, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      aria-label="Profile"
      className={cn(
        "grid size-[38px] cursor-pointer place-items-center rounded-full bg-[#dfe5fa] shadow-[0_0_0_2px_#fff,0_4px_10px_rgb(16_40_139/0.15)] transition-opacity hover:opacity-80",
        className
      )}
      {...props}
    >
      <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
        <circle cx="12" cy="9" r="3.6" fill="#f3f5ff" stroke="#10288b" strokeWidth="1.8" />
        <path d="M5.5 19.5c.8-3.2 3.4-5.2 6.5-5.2s5.7 2 6.5 5.2" fill="#f3f5ff" stroke="#10288b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  )
}

/** Top bar on every screen: green buddy wordmark, notifications bell, account avatar. */
export function AppHeader({ className, ...props }: React.ComponentProps<"header">) {
  return (
    <header
      className={cn("flex h-[62px] items-center justify-between px-[18px] pt-[18px] pb-1.5", className)}
      {...props}
    >
      <Link href="/" aria-label="buddy home">
        <Image src="/assets/buddy-wordmark-green.svg" alt="buddy" width={101} height={32} priority />
      </Link>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Notifications"
          className="grid cursor-pointer place-items-center rounded-full transition-opacity hover:opacity-80"
        >
          <BellIcon />
        </button>
        <AccountButton />
      </div>
    </header>
  )
}
