"use client"

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSettings } from "@/hooks/useSettings"
import { GmailConnectResult } from "@/components/settings/GmailConnectResult"
import { GmailConnectionCard } from "@/components/settings/GmailConnectionCard"
import { WorkspaceMembersCard } from "@/components/settings/WorkspaceMembersCard"
import { LearnedRulesCard } from "@/components/settings/LearnedRulesCard"
import { ReconcileSettingsCard } from "@/components/settings/ReconcileSettingsCard"
import { CurrencyPreferenceCard } from "@/components/settings/CurrencyPreferenceCard"

export default function SettingsPage() {
  const { data, isPending } = useSettings()

  if (isPending || !data) return <SettingsSkeleton />

  return (
    <div className="flex flex-col gap-3.5">
      <Suspense fallback={null}>
        <GmailConnectResult />
      </Suspense>
      <div className="grid grid-cols-2 gap-3.5">
        <GmailConnectionCard gmails={data.gmails} maxGmailAccounts={data.maxGmailAccounts} />
        <WorkspaceMembersCard members={data.members} />
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        <ReconcileSettingsCard settlementLagDays={data.settlementLagDays} />
        <CurrencyPreferenceCard displayCurrency={data.displayCurrency} />
      </div>
      <LearnedRulesCard rules={data.rules} />
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3.5">
        <Skeleton className="h-60 rounded-[14px] bg-hover" />
        <Skeleton className="h-60 rounded-[14px] bg-hover" />
      </div>
      <Skeleton className="h-[180px] rounded-[14px] bg-hover" />
    </div>
  )
}
