import type { UserRole } from "@prisma/client"
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
      language: string
    }
  }

  interface User {
    organizationId: string
    role: UserRole
    language: string
  }
}

declare module "next-auth/adapters" {
  interface AdapterUser {
    organizationId: string
    role: UserRole
    language: string
  }
}
