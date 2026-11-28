import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/buddy/app-header"
import { TabBar } from "@/components/buddy/tab-bar"
import { TopNav } from "@/components/buddy/top-nav"

/**
 * Responsive page shell.
 * - Phone (< 768 px): the Figma layout — 393 px column, buddy header, bottom tab bar.
 * - Tablet / desktop (≥ 768 px): top navigation, wider content; `aside` becomes a second column.
 */
export function Screen({
  children,
  aside,
  className,
  tabBar = true,
  width = "narrow",
}: {
  children: React.ReactNode
  /** Second column on desktop (map, summary…); stacks under the content on phones. */
  aside?: React.ReactNode
  className?: string
  tabBar?: boolean
  /** narrow: forms and flows · wide: grids and lists */
  width?: "narrow" | "wide"
}) {
  return (
    <div className="min-h-svh bg-(image:--page-grad) md:bg-[#eef1f9]">
      <TopNav />
      <main
        className={cn(
          "relative mx-auto flex min-h-svh w-full max-w-[393px] flex-col md:min-h-[calc(100svh-64px)] md:max-w-none md:px-8 md:pt-8 md:pb-16",
          tabBar && "pb-[calc(120px+env(safe-area-inset-bottom))]"
        )}
      >
        <AppHeader className="md:hidden" />
        <div
          className={cn(
            "mx-auto flex w-full flex-1 flex-col px-5 md:px-0",
            aside
              ? "md:grid md:max-w-[1100px] md:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] md:items-start md:gap-8"
              : width === "wide"
                ? "md:max-w-[1100px]"
                : "md:max-w-[680px]",
            className
          )}
        >
          {aside ? (
            <>
              <div className="flex min-w-0 flex-col">{children}</div>
              <aside className="mt-6 flex min-w-0 flex-col gap-4 md:sticky md:top-24 md:mt-0">{aside}</aside>
            </>
          ) : (
            children
          )}
        </div>
        {tabBar && <TabBar className="md:hidden" />}
      </main>
    </div>
  )
}

/** White rounded panel used on desktop to group content (and as a card on phones). */
export function Panel({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-card bg-frost p-4 shadow-soft md:bg-white md:p-6", className)} {...props} />
}
