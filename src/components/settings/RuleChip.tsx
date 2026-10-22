// Client component by import — only ever rendered from <LearnedRulesCard>.
import { X, ArrowRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useT } from "@/components/i18n/LocaleProvider"
import type { LearnedRule } from "@/api-types/settings"
import { RULE_META } from "./constants"
import { ruleTarget } from "./helpers"

interface RuleChipProps {
  rule: LearnedRule
  onRemove: () => void
  removing: boolean
}

export function RuleChip({ rule, onRemove, removing }: RuleChipProps) {
  const t = useT()
  const meta = RULE_META[rule.type]
  const target = ruleTarget(rule)
  return (
    <Badge
      className={cn(
        "h-auto gap-2.25 rounded-full border px-3.5 py-1.75 text-sm font-bold",
        meta.className
      )}
    >
      {rule.merchantPattern}
      <ArrowRight size={13} strokeWidth={2.4} className="opacity-70" />
      {target.kind === "ignore" ? t("settings.rules.noInvoice") : target.text}
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onRemove}
        disabled={removing}
        aria-label={t("settings.rules.removeAria", { pattern: rule.merchantPattern })}
        className="size-auto rounded-none bg-transparent p-0 opacity-55 hover:bg-transparent hover:opacity-100 transition-opacity disabled:opacity-30 [&_svg:not([class*='size-'])]:size-auto"
      >
        <X size={13} strokeWidth={2.4} />
      </Button>
    </Badge>
  )
}
