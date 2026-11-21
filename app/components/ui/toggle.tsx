"use client"

import { Toggle as TogglePrimitive } from "@base-ui/react/toggle"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// buddy Chip (Figma: "36 h · on = navy fill")
const toggleVariants = cva(
  "group/toggle inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap text-navy transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-45 aria-invalid:shadow-[inset_0_0_0_1.5px_var(--destructive)] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // white pill with periwinkle outline; on = navy fill
        default:
          "border border-periwinkle bg-white hover:bg-mint aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white",
        outline:
          "border border-periwinkle bg-white hover:bg-mint aria-pressed:border-navy aria-pressed:bg-navy aria-pressed:text-white",
        // report form chips: frosted, on = tint + navy ring
        soft: "bg-white/90 shadow-[0_3px_10px_rgb(16_40_139/0.06)] hover:bg-white aria-pressed:bg-[#dfe5fa] aria-pressed:shadow-[inset_0_0_0_1.5px_var(--navy)]",
        // chip filled in by Clue from what the user said
        ai: "bg-white/90 shadow-[0_3px_10px_rgb(16_40_139/0.06)] hover:bg-white aria-pressed:bg-[#fdf0fe] aria-pressed:shadow-[inset_0_0_0_1.5px_var(--pink)]",
      },
      size: {
        default: "h-9 min-w-9 px-3.5",
        sm: "h-[30px] min-w-[30px] px-2.5 text-xs",
        lg: "h-[38px] min-w-[38px] px-3 text-[13.5px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Toggle({
  className,
  variant = "default",
  size = "default",
  ...props
}: TogglePrimitive.Props & VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
