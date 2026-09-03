import React from "react"
  import { Input } from "@/components/ui/input"
  import { Label } from "@/components/ui/label"
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"   
  import type { InvoiceRow } from "../types"
  import { CATEGORY_LABELS, CATEGORY_SELECTABLE, type InvoiceCategory } from "@/lib/invoice-categories"
  import { DOCUMENT_TYPE_LABELS, DOCUMENT_TYPE_SELECTABLE, type DocumentType } from "@/lib/document-types"
import { toDraft } from "../helpers"
import { Button } from "@/components/ui/button"
  
interface InvoiceDetailsFormProps {
  invoice: InvoiceRow
  draft: ReturnType<typeof toDraft>
  onFieldChange: (field: keyof ReturnType<typeof toDraft>, value: string) => void
  onDocumentTypeChange: (documentType: DocumentType) => void
  onCategoryChange: (category: InvoiceCategory) => void
  documentType: DocumentType
  category: InvoiceCategory
  isPending: boolean
  onCancel: () => void
  onSave: () => void
}
export function InvoiceDetailsForm({ invoice, draft, onFieldChange, onDocumentTypeChange, onCategoryChange, documentType, category, isPending, onCancel, onSave }: InvoiceDetailsFormProps) {
  const amountValid =
    draft.totalAmount.trim() !== "" &&
    Number.isFinite(Number(draft.totalAmount)) &&
    Number(draft.totalAmount) >= 0;

  return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-5.5">
        <div className="flex flex-col gap-3.25 border border-[#E8EDFA] rounded-[11px] p-3.25 mb-5.5">
          {[
            { field: "vendorName" as const,    label: "Vendor",       type: "text" },
            { field: "invoiceNumber" as const, label: "Invoice #",    type: "text" },
            { field: "totalAmount" as const,   label: `Amount (${invoice.currency})`, type: "number" },
            { field: "invoiceDate" as const,   label: "Invoice date", type: "date" },
            { field: "dueDate" as const,       label: "Due date",     type: "date" },
          ].map((f) => (
            <div key={f.field} className="flex flex-col gap-1.25">
              <Label
                htmlFor={`edit-${f.field}`}
                className="text-[12px] font-semibold text-text-secondary"
              >
                {f.label}
              </Label>
              <Input
                id={`edit-${f.field}`}
                type={f.type}
                step={f.type === "number" ? "0.01" : undefined}
                min={f.type === "number" ? "0" : undefined}
                value={draft[f.field]}
                onChange={(e) => onFieldChange(f.field, e.target.value)}
                className="h-auto px-2.75 py-1.75 text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]"
              />
            </div>
          ))}
          {/* Document type */}
          <div className="flex flex-col gap-1.25">
            <Label className="text-[12px] font-semibold text-text-secondary">Type</Label>
            <Select
              items={DOCUMENT_TYPE_SELECTABLE.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] }))}
              value={documentType}
              onValueChange={(v) => onDocumentTypeChange(v as DocumentType)}
            >
              <SelectTrigger className="h-auto px-2.75 py-1.75 text-[13px] w-full text-text-primary border-[#E8EDFA] rounded-[9px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="w-fit">
                {DOCUMENT_TYPE_SELECTABLE.map((t) => (
                  <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Category */}
          <div className="flex flex-col gap-1.25">
            <Label className="text-[12px] font-semibold text-text-secondary">Category</Label>
            <Select
              items={CATEGORY_SELECTABLE.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
              value={category}
              onValueChange={(v) => onCategoryChange(v as InvoiceCategory)}
            >
              <SelectTrigger className="h-auto px-2.75 py-1.75 text-[13px] w-full text-text-primary border-[#E8EDFA] rounded-[9px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="bottom" align="start" className="w-fit">
                {CATEGORY_SELECTABLE.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        </div>
        <div className="flex flex-col gap-2.5 px-5.5 py-6 border-t border-secondary shrink-0">
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              size="xl"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              size="xl"
              disabled={isPending || !amountValid}
              onClick={onSave}
            >
              {isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </div>
  )
}