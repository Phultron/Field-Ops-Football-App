import type { Metadata } from "next"
import type React from "react"
import { QueryProvider } from "@/components/query-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "Field Ops Fantasy Football",
  description: "2026 NFL Season · Field Service Professionals Competition",
  icons: { icon: "/icon.svg" },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[#0d1117] text-gray-100">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  )
}
