"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Mail, Lock } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  // Redireccionar automáticamente si ya está autenticado
  useEffect(() => {
    if (status === 'authenticated' && session) {
      console.log("Sesión autenticada detectada, redirigiendo...");
      setLoading(false) // Resetear loading antes de redirigir
      router.replace('/dashboard')
    } else if (status === 'unauthenticated' && loading) {
      // Si el status es unauthenticated pero estamos en loading, 
      // significa que el login falló de alguna manera
      console.log("Login parece haber fallado, reseteando loading");
      setLoading(false)
    }
  }, [status, session, router, loading])

  // Timeout de seguridad para resetear loading si algo falla
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log("Timeout alcanzado, reseteando loading");
        setLoading(false)
        setErrorMsg("La operación tomó demasiado tiempo. Por favor intenta de nuevo.");
      }, 10000) // 10 segundos de timeout

      return () => clearTimeout(timeout)
    }
  }, [loading])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setErrorMsg("Credenciales inválidas. Por favor intenta de nuevo.");
        toast({
          variant: "destructive",
          title: "Error al iniciar sesión",
          description: "Credenciales inválidas. Por favor intenta de nuevo.",
        })
        setLoading(false)
        return
      }

      if (result?.ok) {
        // Login exitoso - mostrar mensaje de éxito
        toast({
          title: "Inicio de sesión exitoso",
          description: "¡Bienvenido de nuevo!",
        })
        
        // La redirección será manejada por el useEffect cuando la sesión se actualice
        // No resetear loading aquí para mostrar el estado de transición
        console.log("Login exitoso, esperando actualización de sesión...")
      } else {
        // Caso donde no hay error pero tampoco está ok
        console.log("Resultado de login inesperado:", result);
        setErrorMsg("Error inesperado. Por favor intenta de nuevo.");
        setLoading(false)
      }
    } catch (error) {
      setErrorMsg("Ocurrió un error inesperado. Por favor intenta de nuevo.");
      toast({
        variant: "destructive",
        title: "Error al iniciar sesión",
        description: "Ocurrió un error. Por favor intenta de nuevo.",
      })
      setLoading(false)
    }
  }

  // Mostrar loading mientras verifica la sesión
  if (status === 'loading') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }
  
  // Si ya está autenticado, mostrar mensaje de redirección
  if (status === 'authenticated') {
    return (
      <div className="container flex h-screen w-screen flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-4 text-muted-foreground">Redireccionando al dashboard...</p>
      </div>
    )
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Card className="w-full max-w-lg p-8">
        <div className="flex flex-col space-y-2 text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenido al sistema
          </h1>
          <p className="text-sm text-muted-foreground">
            Ingresa tus credenciales para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  required
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="pl-9"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="text-sm font-medium text-destructive">{errorMsg}</div>
          )}

          <Button className="w-full" type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </Button>
        </form>
      </Card>
    </div>
  )
} 