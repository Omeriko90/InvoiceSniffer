import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingCard } from "@/components/auth/OnboardingCard"

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "radial-gradient(120% 120% at 50% -10%, #EEF3FF 0%, #FAFBFF 55%)" }}
    >
      <OnboardingCard />
    </div>
  )
}
