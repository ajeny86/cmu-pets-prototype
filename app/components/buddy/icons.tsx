import * as React from "react"

/* buddy icons — the same SVGs as the prototype (../index.html) that the Figma screens were generated from.
   Duotone icons fill with the shared "icf" gradient; render <IconDefs /> once per page (done in the root layout). */

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

export function IconDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      <defs>
        <linearGradient id="icf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f5ff" />
          <stop offset="1" stopColor="#cfd8f6" />
        </linearGradient>
      </defs>
    </svg>
  )
}

const line = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const

const duo = { ...line, fill: "url(#icf)" } as const

function svg(size: number, props: React.SVGProps<SVGSVGElement>) {
  return { viewBox: "0 0 24 24", width: size, height: size, "aria-hidden": true, ...props }
}

export function BellIcon({ size = 26, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)}>
      <path {...duo} stroke="#10288b" d="M12 3.6c-3.3 0-5.5 2.6-5.5 6v3.1l-1.9 2.9c-.4.6 0 1.4.7 1.4h13.4c.7 0 1.1-.8.7-1.4l-1.9-2.9V9.6c0-3.4-2.2-6-5.5-6z" />
      <path {...line} stroke="#10288b" d="M9.9 19.6a2.1 2.1 0 0 0 4.2 0" />
      <path d="M18.6 2.4l-.9 1.6M21 5.2l-1.7.7" stroke="#ffcf3f" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  )
}

export function HomeIcon({ size = 26, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)}>
      <path {...duo} d="M4.4 10.4 12 4.2l7.6 6.2V19a1.6 1.6 0 0 1-1.6 1.6h-3.2v-3.9a2.8 2.8 0 0 0-5.6 0v3.9H6A1.6 1.6 0 0 1 4.4 19z" />
    </svg>
  )
}

export function PawIcon({ size = 26, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)}>
      <g {...duo}>
        <circle cx="12" cy="6.2" r="2.2" />
        <circle cx="6.6" cy="9.2" r="2" />
        <circle cx="17.4" cy="9.2" r="2" />
        <path d="M12 12.1c-2.7 0-5.6 3.3-5.6 5.6 0 2 2 2.5 3.4 1.9.8-.4 1.4-.6 2.2-.6s1.4.2 2.2.6c1.4.6 3.4.1 3.4-1.9 0-2.3-2.9-5.6-5.6-5.6z" />
      </g>
    </svg>
  )
}

export function ProfileIcon({ size = 26, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)}>
      <g {...duo}>
        <circle cx="12" cy="8.1" r="3.7" />
        <path d="M4.8 19.3c.6-3.6 3.6-6.1 7.2-6.1s6.6 2.5 7.2 6.1c.1.7-.4 1.3-1.1 1.3H5.9c-.7 0-1.2-.6-1.1-1.3z" />
      </g>
    </svg>
  )
}

export function SettingsIcon({ size = 26, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)}>
      <path {...duo} d="M18.39 9.15 L21.16 9.89 L21.16 14.11 L18.39 14.85 L17.66 16.11 L18.41 18.87 L14.75 20.99 L12.73 18.96 L11.27 18.96 L9.25 20.99 L5.59 18.87 L6.34 16.11 L5.61 14.85 L2.84 14.11 L2.84 9.89 L5.61 9.15 L6.34 7.89 L5.59 5.13 L9.25 3.01 L11.27 5.04 L12.73 5.04 L14.75 3.01 L18.41 5.13 L17.66 7.89 Z" />
      <circle {...line} cx="12" cy="12" r="2.7" fill="#fff" />
    </svg>
  )
}

export function PlusIcon({ size = 24, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)}>
      <path {...line} strokeWidth={2.4} d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 20, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)}>
      <path {...line} strokeWidth={2.2} d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/* Topic icons (Home · "Or explore by topic") */
export function SearchTopicIcon({ size = 28, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)} {...line} stroke="#10288b">
      <circle cx="10.5" cy="10.5" r="6" fill="#e6ebfb" />
      <path d="M15 15l4.5 4.5" />
    </svg>
  )
}

export function HeartTopicIcon({ size = 28, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)} {...line} stroke="#a524b6">
      <path fill="#fce3fe" d="M12 19.5s-7.2-4.4-7.2-10a4.1 4.1 0 0 1 7.2-2.7 4.1 4.1 0 0 1 7.2 2.7c0 5.6-7.2 10-7.2 10z" />
    </svg>
  )
}

export function CareTopicIcon({ size = 28, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)} {...line} stroke="#00594d">
      <rect x="4" y="7.5" width="16" height="12" rx="3" fill="#def3e7" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M12 10.8v5.4M9.3 13.5h5.4" />
    </svg>
  )
}

export function BagTopicIcon({ size = 28, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)} {...line} stroke="#5241c0">
      <path fill="#ebe8ff" d="M5.5 8.5h13l-1 10.5a1.6 1.6 0 0 1-1.6 1.5H8.1a1.6 1.6 0 0 1-1.6-1.5z" />
      <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
    </svg>
  )
}

export function CalendarIcon({ size = 18, ...p }: IconProps) {
  return (
    <svg {...svg(size, p)} {...line}>
      <rect x="4" y="5.5" width="16" height="14" rx="3" fill="url(#icf)" />
      <path d="M8 3.5v4M16 3.5v4M4 10h16" />
    </svg>
  )
}
