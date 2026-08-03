// Client component by import — only ever rendered from <InvoicesClient>.
import { Badge } from "@/components/ui/badge"
import { CATEGORY_COLORS, CATEGORY_LABELS, type InvoiceCategory } from "@/lib/invoice-categories"

export function CategoryBadge({ category }: { category: InvoiceCategory }) {
  const meta = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.UNCATEGORIZED
  return (
    <Badge
      className="rounded-full h-auto text-[11.5px] font-[700] px-[10px] py-[2px] truncate max-w-full"
      style={{ background: meta.bg, color: meta.color }}
    >
      {CATEGORY_LABELS[category] ?? CATEGORY_LABELS.UNCATEGORIZED}
    </Badge>
  )
}
