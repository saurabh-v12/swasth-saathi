import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/contexts/auth-context"
import { SocketProvider } from "@/contexts/socket-context"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Swasth Saathi - Healthcare Management System",
  description: "Comprehensive healthcare management platform for doctors, patients, and pharmacists",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={<div>Loading...</div>}>
          <SocketProvider>
            <AuthProvider>{children}</AuthProvider>
          </SocketProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
