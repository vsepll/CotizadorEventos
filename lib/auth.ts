import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { findUserByEmail, validatePassword } from "./activity.js"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Credenciales incompletas");
          return null
        }

        console.log(`Buscando usuario: ${credentials.email}`);
        // Buscar usuario en la lista hardcoded
        const user = findUserByEmail(credentials.email)

        if (!user) {
          console.log(`Usuario no encontrado: ${credentials.email}`);
          return null
        }

        console.log(`Usuario encontrado: ${user.email}, verificando contraseña...`);
        const isPasswordValid = validatePassword(credentials.password, user.password)

        if (!isPasswordValid) {
          console.log("Contraseña inválida");
          return null
        }

        console.log("Autenticación exitosa");
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        console.log("JWT callback - Usuario autenticado:", user);
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      console.log("Session callback - Creando sesión");
      if (session?.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Simplificar redirecciones para mejor performance
      
      // Para URLs relativas, usar baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`
      
      // Para URLs del mismo dominio, permitir
      if (url.startsWith(baseUrl)) return url
      
      // Por defecto, ir al dashboard
      return `${baseUrl}/dashboard`
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Redirigir errores a la página de login
  },
  events: {
    async signIn({ user }) {
      console.log("Usuario iniciando sesión:", user.email);
    },
    async signOut() {
      console.log("Usuario cerrando sesión");
    },
  },
  debug: false, // Desactivar en producción para mejor performance
} 