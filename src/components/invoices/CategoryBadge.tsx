// Client component by import — only ever rendered from <InvoicesClient>.
import { MetaBadge } from "@/components/ui/meta-badge"
import { CATEGORY_COLORS, CATEGORY_LABELS, type InvoiceCategory } from "@/lib/invoice-categories"

export function CategoryBadge({ category }: { category: InvoiceCategory }) {
  const meta = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.UNCATEGORIZED
  return (
    <MetaBadge
      label={CATEGORY_LABELS[category] ?? CATEGORY_LABELS.UNCATEGORIZED}
      bg={meta.bg}
      color={meta.color}
      className="truncate max-w-full"
    />
  )
}
