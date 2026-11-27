import { cn } from "@/lib/utils"
import { AppHeader } from "@/components/buddy/app-header"
import { TabBar } from "@/components/buddy/tab-bar"

/**
 * Phone-width screen (393 px, like the Figma frames) on the soft page gradient.
 * On wide windows it becomes a rounded card running to the bottom of the window, with the tab bar inside it.
 */
export function Screen({
  children,
  className,
  tabBar = true,
}: {
  children: React.ReactNode
  className?: string
  tabBar?: boolean
}) {
  return (
    <div className="flex min-h-svh justify-center bg-[#eceff8] min-[500px]:pt-8">
      <main
        className={cn(
          "relative flex min-h-svh w-full max-w-[393px] flex-col bg-(image:--page-grad) min-[500px]:min-h-[calc(100svh-32px)] min-[500px]:rounded-t-[32px] min-[500px]:shadow-[0_1px_2px_rgb(0_0_0/0.04),0_12px_40px_rgb(37_42_49/0.08)]",
          tabBar && "pb-[calc(120px+env(safe-area-inset-bottom))]",
          className
        )}
      >
        <AppHeader />
        <div className="flex flex-1 flex-col px-5">{children}</div>
        {tabBar && <TabBar />}
      </main>
    </div>
  )
}
