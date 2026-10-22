"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useDeleteAlias } from "@/hooks/useDeleteAlias"
import { useT } from "@/components/i18n/LocaleProvider"
import type { LearnedRule } from "@/api-types/settings"
import { RuleChip } from "./RuleChip"

interface LearnedRulesCardProps {
  rules: LearnedRule[]
}

export function LearnedRulesCard({ rules }: LearnedRulesCardProps) {
  const t = useT()
  const deleteAlias = useDeleteAlias()

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-heading leading-none">{t("settings.rules.title")}</h2>
            <p className="text-sm text-text-secondary mt-[7px]">
              {t("settings.rules.description")}
            </p>
          </div>
          <p className="text-sm text-dim shrink-0">
            {t("settings.rules.count", { count: rules.length })}
          </p>
        </div>

        {rules.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-text-secondary">
            {t("settings.rules.empty")}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {rules.map((rule) => (
              <RuleChip
                key={rule.id}
                rule={rule}
                onRemove={() => deleteAlias.mutate(rule.id)}
                removing={deleteAlias.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
