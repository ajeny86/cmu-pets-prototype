import type { Metadata, Viewport } from "next"
import { Geist_Mono, Google_Sans_Flex } from "next/font/google"

import "./globals.css"
import { IconDefs } from "@/components/buddy/icons"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const googleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  variable: "--font-sans",
  // next/font has no metrics for this family, so name the fallback ourselves
  adjustFontFallback: false,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "buddy",
  description: "Everything for you and your pet, in one place.",
}

export const viewport: Viewport = {
  themeColor: "#f5f7fd",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        googleSansFlex.variable
      )}
    >
      <body>
        <IconDefs />
        {/* buddy has no dark mode yet */}
        <ThemeProvider forcedTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  )
}
