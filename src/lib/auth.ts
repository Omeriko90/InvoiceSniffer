import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
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
  events: {
    // Create org on first sign-in
    async createUser({ user }) {
      const slug = user.email!
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 48)

      const org = await prisma.organization.create({
        data: {
          name: user.name ?? user.email!.split("@")[0],
          slug: `${slug}-${Math.random().toString(36).slice(2, 6)}`,
        },
      })

      await prisma.user.update({
        where: { id: user.id },
        data: { organizationId: org.id, role: "OWNER" },
      })
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
})
