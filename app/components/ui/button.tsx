import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-[15px] font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Pill button · navy (Figma: "Navy 48 h")
        default:
          "bg-primary text-primary-foreground shadow-btn hover:bg-primary-hover",
        // Pill button · white (Figma: "white 44 h")
        outline:
          "border-0 bg-white/85 text-navy shadow-[0_4px_12px_rgb(16_40_139/0.07)] hover:bg-white aria-expanded:bg-white aria-pressed:bg-tint",
        green:
          "bg-green text-white shadow-[0_6px_8px_rgb(0_89_77/0.12)] hover:bg-[#049a3f]",
        // AI actions: the pink accent is reserved for Clue
        ai: "bg-pink text-white shadow-[0_8px_18px_rgb(243_124_255/0.45)] hover:brightness-105",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-tint-2 aria-expanded:bg-secondary",
        ghost:
          "hover:bg-tint hover:text-navy aria-expanded:bg-tint aria-expanded:text-navy",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 gap-2 px-[22px] has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        xs: "h-7 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3.5 text-[13px] has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        lg: "h-14 gap-2 px-6 text-base",
        icon: "size-12 [&_svg:not([class*='size-'])]:size-5",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10",
        "icon-lg": "size-14 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    compoundVariants: [
      // white pills sit at 44 h, navy at 48 h
      { variant: "outline", size: "default", className: "h-11 px-[18px]" },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
