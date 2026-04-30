import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/server/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: {
            contador: true,
            perfil: { include: { permissoes: true } }
          }
        })

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.senha)
        if (!valid) return null

        return {
          id: user.id,
          email: user.email,
          nome: user.nome,
          globalRole: user.globalRole,
          contadorId: user.contadorId,
          contadorNome: user.contador?.nome,
          perfil: user.perfil ? {
            nome: user.perfil.nome,
            isAdmin: user.perfil.isAdmin,
            permissoes: user.perfil.permissoes.map((p: any) => p.codigo)
          } : undefined
        }
      }
    })
  ],
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.globalRole = user.globalRole
        token.contadorId = user.contadorId
        token.contadorNome = user.contadorNome
        token.perfil = user.perfil
        token.permissoes = user.perfil?.permissoes || []
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.globalRole = token.globalRole
        session.user.contadorId = token.contadorId
        session.user.contadorNome = token.contadorNome
        session.user.perfil = token.perfil
        session.user.permissoes = token.permissoes || []
      }
      return session
    }
  }
}