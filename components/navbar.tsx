"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Plus, ClipboardCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"

export function Navbar() {
  const { data: session } = useSession()
  const [reviewCount, setReviewCount] = useState(0)
  
  // Fetch the number of quotations in review status
  useEffect(() => {
    const fetchReviewCount = async () => {
      try {
        const response = await fetch("/api/quotations/stats", {
          credentials: "include"
        })
        if (response.ok) {
          const data = await response.json()
          if (data.statusCounts && data.statusCounts.review) {
            setReviewCount(data.statusCounts.review)
          }
        }
      } catch (error) {
        console.error("Error fetching review count:", error)
      }
    }
    
    if (session) {
      fetchReviewCount()
    }
  }, [session])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Cotizador de Eventos
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/quotations"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Cotizaciones
            </Link>
            <Link
              href="/quotation"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Nueva Cotización
            </Link>
            <Link
              href="/review-dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60 flex items-center gap-2"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>En Revisión</span>
              {reviewCount > 0 && (
                <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-400">
                  {reviewCount}
                </Badge>
              )}
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <ThemeToggle />
            {session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button>Iniciar Sesión</Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
} 