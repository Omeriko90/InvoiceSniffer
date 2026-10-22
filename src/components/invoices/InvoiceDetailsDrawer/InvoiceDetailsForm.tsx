import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useT } from "@/components/i18n/LocaleProvider"
import type { InvoiceRow } from "../types"
import {
  CATEGORY_LABELS,
  CATEGORY_SELECTABLE,
  INVOICE_CATEGORIES,
  type InvoiceCategory,
} from "@/lib/invoice-categories"
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_SELECTABLE,
  DOCUMENT_TYPES,
  type DocumentType,
} from "@/lib/document-types"

const makeSchema = (t: ReturnType<typeof useT>) =>
  z.object({
    vendorName: z.string().trim().max(200),
    invoiceNumber: z.string().trim().max(200),
    totalAmount: z
      .string()
      .trim()
      .min(1, t("invoices.form.error.amountRequired"))
      .refine((v) => Number.isFinite(Number(v)) && Number(v) >= 0, t("invoices.form.error.amountInvalid")),
    invoiceDate: z.string(),
    dueDate: z.string(),
    documentType: z.enum(DOCUMENT_TYPES),
    category: z.enum(INVOICE_CATEGORIES),
  })

export type InvoiceEditFormValues = z.infer<ReturnType<typeof makeSchema>>

const fieldLabel = "text-[12px] font-semibold text-text-secondary"
const fieldInput =
  "h-auto px-2.75 py-1.75 text-[13px] text-text-primary border-[#E8EDFA] rounded-[9px]"
const fieldTrigger = `${fieldInput} w-full`

// Text/number/date inputs, registered directly. `as const` narrows each
// `field` to a real key of the form values so register() type-checks.
const TEXT_FIELDS = [
  { field: "vendorName", labelKey: "invoices.detail.field.vendor", type: "text" },
  { field: "invoiceNumber", labelKey: "invoices.detail.field.invoiceNumber", type: "text" },
  { field: "totalAmount", labelKey: "invoices.detail.field.amount", type: "number" },
  { field: "invoiceDate", labelKey: "invoices.detail.field.invoiceDate", type: "date" },
  { field: "dueDate", labelKey: "invoices.detail.field.dueDate", type: "date" },
] as const

interface InvoiceDetailsFormProps {
  invoice: InvoiceRow
  isPending: boolean
  onCancel: () => void
  onSubmit: (values: InvoiceEditFormValues) => void
}

export function InvoiceDetailsForm({
  invoice,
  isPending,
  onCancel,
  onSubmit,
}: InvoiceDetailsFormProps) {
  const t = useT()
  const schema = makeSchema(t)
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<InvoiceEditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      vendorName: invoice.vendorName ?? "",
      invoiceNumber: invoice.invoiceNumber ?? "",
      totalAmount: invoice.totalAmount,
      invoiceDate: invoice.invoiceDate?.slice(0, 10) ?? "",
      dueDate: invoice.dueDate?.slice(0, 10) ?? "",
      documentType: invoice.documentType,
      category: invoice.category,
    },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-y-auto p-5.5">
        <div className="flex flex-col gap-3.25 border border-[#E8EDFA] rounded-[11px] p-3.25 mb-5.5">
          {TEXT_FIELDS.map((f) => (
            <div key={f.field} className="flex flex-col gap-1.25">
              <Label htmlFor={`edit-${f.field}`} className={fieldLabel}>
                {f.field === "totalAmount"
                  ? t("invoices.detail.field.amountWithCurrency", { currency: invoice.currency })
                  : t(f.labelKey)}
              </Label>
              <Input
                id={`edit-${f.field}`}
                type={f.type}
                step={f.type === "number" ? "0.01" : undefined}
                min={f.type === "number" ? "0" : undefined}
                className={fieldInput}
                {...register(f.field)}
              />
              {errors[f.field] && (
                <p className="text-xs text-danger">{errors[f.field]?.message}</p>
              )}
            </div>
          ))}

          {/* Document type */}
          <div className="flex flex-col gap-1.25">
            <Label className={fieldLabel}>{t("invoices.detail.field.type")}</Label>
            <Controller
              control={control}
              name="documentType"
              render={({ field }) => (
                <Select
                  items={DOCUMENT_TYPE_SELECTABLE.map((t) => ({ value: t, label: DOCUMENT_TYPE_LABELS[t] }))}
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v as DocumentType)}
                >
                  <SelectTrigger className={fieldTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" className="w-fit">
                    {DOCUMENT_TYPE_SELECTABLE.map((t) => (
                      <SelectItem key={t} value={t}>{DOCUMENT_TYPE_LABELS[t]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.25">
            <Label className={fieldLabel}>{t("invoices.detail.field.category")}</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  items={CATEGORY_SELECTABLE.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v as InvoiceCategory)}
                >
                  <SelectTrigger className={fieldTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent side="bottom" align="start" className="w-fit">
                    {CATEGORY_SELECTABLE.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-5.5 py-6 border-t border-secondary shrink-0">
        <div className="flex gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            size="xl"
            disabled={isPending}
            onClick={onCancel}
          >
            {t("invoices.actions.cancel")}
          </Button>
          <Button type="submit" className="flex-1" size="xl" disabled={isPending}>
            {isPending ? t("invoices.detail.saving") : t("invoices.detail.saveChanges")}
          </Button>
        </div>
      </div>
    </form>
  )
}
