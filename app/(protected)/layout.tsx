import type React from "react"
import { Inter } from "next/font/google"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/auth-provider"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <div className="relative flex min-h-screen flex-col bg-background">
          <Navbar />
          <main className="flex-1">
            <div className="container py-6">
              {children}
            </div>
          </main>
        </div>
      </AuthProvider>
      <Toaster />
    </ThemeProvider>
  )
} 