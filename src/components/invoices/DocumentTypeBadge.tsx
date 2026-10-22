// Client component by import — only ever rendered from <InvoicesClient>.
import { StatusPill } from "@/components/ui/status-pill"
import { DOCUMENT_TYPE_COLORS, type DocumentType } from "@/lib/document-types"
import { useT } from "@/components/i18n/LocaleProvider"

export function DocumentTypeBadge({ documentType }: { documentType: DocumentType }) {
  const t = useT()
  const meta = DOCUMENT_TYPE_COLORS[documentType] ?? DOCUMENT_TYPE_COLORS.UNKNOWN
  return (
    <StatusPill bg={meta.bg} color={meta.color} className="truncate max-w-full">
      {t(`docTypes.${documentType}`)}
    </StatusPill>
  )
}
