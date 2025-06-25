"use client"

import { SessionProvider } from "next-auth/react"
import { Toaster } from "@/components/ui/toaster"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <SessionProvider
      // Refresca la sesión cada 5 minutos (más eficiente)
      refetchInterval={5 * 60}
      // No refresca automáticamente cuando se enfoca la ventana (mejora performance)
      refetchOnWindowFocus={false}
      // No refresca cuando se pierde la conexión (evita llamadas innecesarias)
      refetchWhenOffline={false}
      // Reducir el tiempo de base para mejor responsividad
      basePath="/api/auth"
    >
      {children}
      <Toaster />
    </SessionProvider>
  )
} 