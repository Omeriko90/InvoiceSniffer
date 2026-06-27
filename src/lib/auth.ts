import NextAuth from "next-auth"
import type { AdapterUser } from "next-auth/adapters"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

function makeAdapter() {
  const base = PrismaAdapter(prisma)
  return {
    ...base,
    async createUser(data: AdapterUser): Promise<AdapterUser> {
      const slug = data.email!
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 48)

      const org = await prisma.organization.create({
        data: {
          name: data.name ?? data.email!.split("@")[0],
          slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
        },
      })

      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email!,
          image: data.image,
          emailVerified: data.emailVerified,
          organizationId: org.id,
          role: "OWNER",
        },
      })

      return { ...user, emailVerified: user.emailVerified } as AdapterUser
    },
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: makeAdapter(),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.organizationId = user.organizationId
        session.user.role = user.role
      }
      return session
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})
