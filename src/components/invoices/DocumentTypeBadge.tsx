// Client component by import — only ever rendered from <InvoicesClient>.
import { StatusPill } from "@/components/ui/status-pill"
import { DOCUMENT_TYPE_COLORS, DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/document-types"

export function DocumentTypeBadge({ documentType }: { documentType: DocumentType }) {
  const meta = DOCUMENT_TYPE_COLORS[documentType] ?? DOCUMENT_TYPE_COLORS.UNKNOWN
  return (
    <StatusPill bg={meta.bg} color={meta.color} className="truncate max-w-full">
      {DOCUMENT_TYPE_LABELS[documentType] ?? DOCUMENT_TYPE_LABELS.UNKNOWN}
    </StatusPill>
  )
}
