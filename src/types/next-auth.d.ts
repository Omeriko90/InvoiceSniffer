import type { UserRole } from "@/generated/prisma"
import "next-auth"
import "next-auth/adapters"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      organizationId: string
      role: UserRole
    }
  }

  interface User {
    organizationId: string
    role: UserRole
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    organizationId: string
    role: UserRole
  }
}
