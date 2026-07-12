import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/shell/Sidebar"
import { Topbar } from "@/components/shell/Topbar"
import { PostHogIdentify } from "@/components/shared/PostHogIdentify"
import { headers } from "next/headers"

// Map pathnames to page titles
function getTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard"
  if (pathname.startsWith("/invoices"))  return "Invoices"
  if (pathname.startsWith("/import"))    return "Import CSV"
  if (pathname.startsWith("/reconcile")) return "Reconcile"
  if (pathname.startsWith("/alerts"))    return "Alerts"
  if (pathname.startsWith("/exports"))   return "Exports"
  if (pathname.startsWith("/settings"))  return "Settings"
  return "Reconcile"
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  const headerList = await headers()
  const pathname = headerList.get("x-pathname") ?? ""
  const title = getTitle(pathname)

  const initials = session.user.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : session.user.email?.[0]?.toUpperCase() ?? "?"

  return (
    <div className="h-screen flex overflow-hidden">
      <PostHogIdentify
        userId={session.user.id}
        email={session.user.email}
        name={session.user.name}
        organizationId={session.user.organizationId}
      />
      <Sidebar
        orgName="My Workspace"
        userName={session.user.name ?? undefined}
        userEmail={session.user.email ?? undefined}
        userInitials={initials}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={title} gmailConnected={false} />
        <main className="flex-1 overflow-y-auto bg-background p-7">
          {children}
        </main>
      </div>
    </div>
  )
}
