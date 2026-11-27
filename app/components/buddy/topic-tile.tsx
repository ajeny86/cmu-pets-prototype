import Link from "next/link"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const topicTileVariants = cva(
  "flex min-h-[70px] items-center gap-2.5 rounded-[20px] py-[13px] pr-2.5 pl-3 text-left shadow-[0_6px_16px_rgb(16_40_139/0.07),inset_0_1px_0_rgb(255_255_255/0.65)] transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_10px_22px_rgb(16_40_139/0.1),inset_0_1px_0_rgb(255_255_255/0.65)] [&>svg]:shrink-0",
  {
    variants: {
      tone: {
        navy: "bg-topic-navy",
        pink: "bg-topic-pink",
        green: "bg-topic-green",
        lilac: "bg-topic-lilac",
      },
    },
    defaultVariants: { tone: "navy" },
  }
)

type TopicTileProps = VariantProps<typeof topicTileVariants> & {
  href: string
  icon: React.ReactNode
  title: string
  subtitle: string
  className?: string
}

/** Tinted tile on Home · "Or explore by topic". */
export function TopicTile({ href, icon, title, subtitle, tone, className }: TopicTileProps) {
  return (
    <Link href={href} className={cn(topicTileVariants({ tone }), className)}>
      {icon}
      <span className="min-w-0">
        <b className="block text-[13.5px] leading-[17px] font-extrabold tracking-[-0.35px] whitespace-nowrap text-navy">
          {title}
        </b>
        <small className="mt-0.5 block text-[11px] leading-[14px] text-sub">{subtitle}</small>
      </span>
    </Link>
  )
}
