// Client component by import — only ever rendered from <InvoicesClient>.
import { StatusPill } from "@/components/ui/status-pill"
import { CATEGORY_COLORS, CATEGORY_LABELS, type InvoiceCategory } from "@/lib/invoice-categories"

export function CategoryBadge({ category }: { category: InvoiceCategory }) {
  const meta = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.UNCATEGORIZED
  return (
    <StatusPill bg={meta.bg} color={meta.color} className="truncate max-w-full">
      {CATEGORY_LABELS[category] ?? CATEGORY_LABELS.UNCATEGORIZED}
    </StatusPill>
  )
}
