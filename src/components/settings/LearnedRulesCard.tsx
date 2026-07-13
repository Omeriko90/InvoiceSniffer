"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useDeleteAlias } from "@/hooks/useDeleteAlias"
import type { LearnedRule } from "@/api-types/settings"
import { RuleChip } from "./RuleChip"

interface LearnedRulesCardProps {
  rules: LearnedRule[]
}

export function LearnedRulesCard({ rules }: LearnedRulesCardProps) {
  const deleteAlias = useDeleteAlias()

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-[16px]">
          <div>
            <h2 className="text-[16px] font-[700] text-heading leading-none">Learned rules &amp; aliases</h2>
            <p className="text-[13px] text-text-secondary mt-[7px]">
              These power smarter matching over time. Remove any that look wrong.
            </p>
          </div>
          <p className="text-[13px] text-dim shrink-0">
            Built from your corrections · {rules.length} {rules.length === 1 ? "rule" : "rules"}
          </p>
        </div>

        {rules.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[13px] text-text-secondary">
            No rules yet — they appear as you confirm and correct matches.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[10px]">
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
