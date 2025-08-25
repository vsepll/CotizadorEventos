import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdminRoute = req.nextUrl.pathname.startsWith("/admin")

    if (isAdminRoute && token?.role !== "ADMIN") {
      if (process.env.NODE_ENV !== "production") {
        console.log("Usuario sin permisos intentando acceder a ruta de admin, redirigiendo...")
      }
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    "/admin/:path*", 
    "/dashboard/:path*",
    "/quotation/:path*",
    "/quotations/:path*",
    "/settings/:path*"
  ]
} 