"use client"

import { X, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useDeleteAlias } from "@/hooks/useDeleteAlias"
import type { LearnedRule, RuleType } from "@/api-types/settings"

interface LearnedRulesCardProps {
  rules: LearnedRule[]
}

const RULE_META: Record<RuleType, { color: string; bg: string; border: string }> = {
  POSITIVE: { color: "#047857", bg: "#ECFDF5", border: "#BBE7CD" },
  NEGATIVE: { color: "#B91C1C", bg: "#FEF2F2", border: "#FECACA" },
  IGNORE:   { color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
}

function ruleTarget(rule: LearnedRule): string {
  if (rule.type === "IGNORE") return "no invoice"
  if (rule.type === "NEGATIVE") return `≠ ${rule.vendorName}`
  return rule.vendorName
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
          <p className="text-[13px] text-muted shrink-0">
            Built from your corrections · {rules.length} {rules.length === 1 ? "rule" : "rules"}
          </p>
        </div>

        {rules.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-[13px] text-text-secondary">
            No rules yet — they appear as you confirm and correct matches.
          </div>
        ) : (
          <div className="flex flex-wrap gap-[10px]">
            {rules.map((rule) => {
              const meta = RULE_META[rule.type]
              return (
                <span
                  key={rule.id}
                  className="inline-flex items-center gap-[9px] rounded-full border px-[14px] py-[7px] text-[13px] font-[700]"
                  style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                >
                  {rule.merchantPattern}
                  <ArrowRight size={13} strokeWidth={2.4} className="opacity-70" />
                  {ruleTarget(rule)}
                  <button
                    onClick={() => deleteAlias.mutate(rule.id)}
                    disabled={deleteAlias.isPending}
                    aria-label={`Remove rule for ${rule.merchantPattern}`}
                    className="opacity-55 hover:opacity-100 transition-opacity disabled:opacity-30"
                  >
                    <X size={13} strokeWidth={2.4} />
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
