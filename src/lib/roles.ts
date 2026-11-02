import type { UserRole } from "@prisma/client"

export const PRIVILEGED_ROLES = ["OWNER", "ADMIN"] as const

export function isPrivilegedRole(role: UserRole): boolean {
  return (PRIVILEGED_ROLES as readonly UserRole[]).includes(role)
}
