import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/server/prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Login", type: "text" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials: any) {
        if (!credentials?.login || !credentials?.password) return null

        // Find user by login or email
        const user = await prisma.usuario.findFirst({
          where: {
            OR: [
              { login: credentials.login },
              { email: credentials.login }
            ]
          },
          include: {
            escritorio: { select: { id: true, codigo: true, nome: true } },
            perfil: { include: { permissoes: true } }
          }
        })

        if (!user) return null

        const valid = await bcrypt.compare(credentials.password, user.senha)
        if (!valid) return null

        return {
          id: user.id,
          login: user.login,
          email: user.email,
          nome: user.nome,
          globalRole: user.globalRole,
          escritorioId: user.escritorioId,
          escritorioCodigo: user.escritorio?.codigo,
          escritorioNome: user.escritorio?.nome,
          perfil: user.perfil ? {
            nome: user.perfil.nome,
            isAdmin: user.perfil.nome === 'ADMIN',
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
        token.login = user.login
        token.globalRole = user.globalRole
        token.escritorioId = user.escritorioId
        token.escritorioCodigo = user.escritorioCodigo
        token.escritorioNome = user.escritorioNome
        token.perfil = user.perfil
        token.permissoes = user.perfil?.permissoes || []
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id
        session.user.login = token.login
        session.user.globalRole = token.globalRole
        session.user.escritorioId = token.escritorioId
        session.user.escritorioCodigo = token.escritorioCodigo
        session.user.escritorioNome = token.escritorioNome
        session.user.perfil = token.perfil
        session.user.permissoes = token.permissoes || []
      }
      return session
    }
  }
}
