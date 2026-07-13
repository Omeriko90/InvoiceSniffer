// Client component by import — only ever rendered from <LearnedRulesCard>.
import { X, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { LearnedRule } from "@/api-types/settings"
import { RULE_META } from "./constants"
import { ruleTarget } from "./helpers"

interface RuleChipProps {
  rule: LearnedRule
  onRemove: () => void
  removing: boolean
}

export function RuleChip({ rule, onRemove, removing }: RuleChipProps) {
  const meta = RULE_META[rule.type]
  return (
    <Badge
      className="h-auto gap-[9px] rounded-full border px-[14px] py-[7px] text-[13px] font-[700]"
      style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
    >
      {rule.merchantPattern}
      <ArrowRight size={13} strokeWidth={2.4} className="opacity-70" />
      {ruleTarget(rule)}
      <button
        onClick={onRemove}
        disabled={removing}
        aria-label={`Remove rule for ${rule.merchantPattern}`}
        className="opacity-55 hover:opacity-100 transition-opacity disabled:opacity-30"
      >
        <X size={13} strokeWidth={2.4} />
      </button>
    </Badge>
  )
}
