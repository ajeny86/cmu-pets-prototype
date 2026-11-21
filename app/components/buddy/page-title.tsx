import Link from "next/link"

/** "‹ Home" back link above a flow page title (prototype `.back`). */
export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="self-start text-[13px] leading-[18px] font-semibold text-muted-foreground hover:underline"
    >
      ‹ {children}
    </Link>
  )
}

/** Flow page title: H1 32/35 + muted lede (prototype `.title`). */
export function PageTitle({ title, children }: { title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-h1">{title}</h1>
      {children && <p className="mt-2 text-sm leading-[19px] text-muted-foreground">{children}</p>}
    </div>
  )
}
