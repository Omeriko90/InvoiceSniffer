// Client component by import — only ever rendered from <InvoicesClient>.
import { StatusPill } from "@/components/ui/status-pill"
import { CATEGORY_COLORS, type InvoiceCategory } from "@/lib/invoice-categories"
import { useT } from "@/components/i18n/LocaleProvider"

export function CategoryBadge({ category }: { category: InvoiceCategory }) {
  const t = useT()
  const meta = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.UNCATEGORIZED
  return (
    <StatusPill bg={meta.bg} color={meta.color} className="truncate max-w-full">
      {t(`categories.${category}`)}
    </StatusPill>
  )
}
