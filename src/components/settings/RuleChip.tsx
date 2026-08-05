// Client component by import — only ever rendered from <LearnedRulesCard>.
import { X, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
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
      className={cn(
        "h-auto gap-2.25 rounded-full border px-3.5 py-1.75 text-sm font-bold",
        meta.className
      )}
    >
      {rule.merchantPattern}
      <ArrowRight size={13} strokeWidth={2.4} className="opacity-70" />
      {ruleTarget(rule)}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        disabled={removing}
        aria-label={`Remove rule for ${rule.merchantPattern}`}
        className="size-auto rounded-none bg-transparent p-0 opacity-55 hover:bg-transparent hover:opacity-100 transition-opacity disabled:opacity-30 [&_svg:not([class*='size-'])]:size-auto"
      >
        <X size={13} strokeWidth={2.4} />
      </Button>
    </Badge>
  )
}
