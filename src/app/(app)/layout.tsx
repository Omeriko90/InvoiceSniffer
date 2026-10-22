import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/shell/Sidebar"
import { Topbar } from "@/components/shell/Topbar"
import { PostHogIdentify } from "@/components/shared/PostHogIdentify"
import { PageViewTracker } from "@/components/shared/PageViewTracker"
import { ExportsProvider } from "@/components/exports/ExportsProvider"
import { getT } from "@/lib/i18n/getLocale.server"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  const t = await getT()

  const initials = session.user.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : session.user.email?.[0]?.toUpperCase() ?? "?"

  return (
    <ExportsProvider>
    <div className="h-screen flex overflow-hidden">
      <PostHogIdentify
        userId={session.user.id}
        email={session.user.email}
        name={session.user.name}
        organizationId={session.user.organizationId}
      />
      <PageViewTracker />
      <Sidebar
        orgName={t("shell.sidebar.default_org_name")}
        userName={session.user.name ?? undefined}
        userEmail={session.user.email ?? undefined}
        userInitials={initials}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-background p-7">
          {children}
        </main>
      </div>
    </div>
    </ExportsProvider>
  )
}
