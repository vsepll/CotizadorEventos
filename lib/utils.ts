import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { signOut } from "next-auth/react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función utilitaria para manejar logout rápido con redirección manual
export async function handleSignOut() {
  try {
    // Usar redirect: false para control manual y mayor velocidad
    const result = await signOut({ 
      redirect: false 
    })
    
    // Redirección inmediata sin esperar a NextAuth
    window.location.replace("/login")
  } catch (error) {
    console.error("Error durante el logout:", error)
    // Fallback: redirigir inmediatamente de todas formas
    window.location.replace("/login")
  }
}
