// Client component by import — rendered from <FixedExpensesClient> and the
// invoice drawer (both are client entries). Shared create/edit form for a fixed
// expense; in the drawer flow it's pre-filled from an invoice and links it on save.
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { FormDialog } from "@/components/ui/form-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateFixedExpense } from "@/hooks/useCreateFixedExpense"
import { useUpdateFixedExpense } from "@/hooks/useUpdateFixedExpense"
import { useFixedExpensesList } from "@/hooks/useFixedExpensesList"
import { useAbsorbInvoice } from "@/hooks/useAbsorbInvoice"
import {
  CATEGORY_SELECTABLE,
  INVOICE_CATEGORIES,
  type InvoiceCategory,
} from "@/lib/invoice-categories"
import { FIXED_EXPENSE_FREQUENCIES, type FixedExpenseFrequency } from "@/lib/fixed-expense-meta"
import { track } from "@/lib/analytics"
import { useT } from "@/components/i18n/LocaleProvider"
import type { TranslationKey } from "@/lib/i18n/translate"
import type { FixedExpenseRow } from "./types"

type TFn = (key: TranslationKey) => string

// Vendor titles / sender emails are entered comma-separated (the columns are
// arrays). Split, trim, drop blanks, and dedup case-insensitively (keeping the
// first-seen spelling) so the same value can't be entered twice.
function parseList(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of raw.split(",").map((s) => s.trim())) {
    const key = value.toLowerCase()
    if (value && !seen.has(key)) {
      seen.add(key)
      out.push(value)
    }
  }
  return out
}

function makeSchema(t: TFn) {
  return z
    .object({
      name: z.string().trim().min(1, t("fixed_expenses.form.error.name_required")).max(200),
      category: z.enum(INVOICE_CATEGORIES),
      vendorName: z.string().trim().max(200),
      senderEmail: z.string().trim().max(200),
      gmailCredentialId: z.string(),
      expectedAmount: z.string().trim(),
      currency: z.string().trim().min(1).max(8),
      frequency: z.enum(FIXED_EXPENSE_FREQUENCIES),
      anchorDate: z.string().min(1, t("fixed_expenses.form.error.anchor_required")),
      gracePeriodDays: z.string(),
    })
    .refine((v) => v.vendorName.trim() !== "" || v.senderEmail.trim() !== "", {
      message: t("fixed_expenses.form.error.source_required"),
      path: ["vendorName"],
    })
    .refine(
      (v) =>
        v.senderEmail.trim() === "" ||
        parseList(v.senderEmail).every((e) => z.string().email().safeParse(e).success),
      { message: t("fixed_expenses.form.error.invalid_emails"), path: ["senderEmail"] },
    )
    .refine((v) => v.expectedAmount.trim() === "" || /^\d+(\.\d{1,4})?$/.test(v.expectedAmount.trim()), {
      message: t("fixed_expenses.form.error.invalid_amount"),
      path: ["expectedAmount"],
    })
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>

const fieldLabel = "text-xs font-semibold text-text-secondary"
const fieldInput =
  "h-auto px-[11px] py-[7px] text-sm text-text-primary border-border rounded-[9px]"
const fieldTrigger = `${fieldInput} w-full justify-between`

export function FixedExpenseFormDialog({
  expense,
  prefill,
  linkInvoiceId,
  mailboxes,
  onClose,
  onSaved,
}: {
  // Present → edit mode. Absent → create mode.
  expense?: FixedExpenseRow
  // Create-mode seed (e.g. from the invoice drawer).
  prefill?: Partial<FormValues>
  linkInvoiceId?: string
  mailboxes: { id: string; label: string }[]
  onClose: () => void
  onSaved: () => void
}) {
  const t = useT()
  const schema = makeSchema(t)
  const freqLabel = (f: FixedExpenseFrequency): string =>
    ({
      WEEKLY: t("fixed_expenses.frequency.weekly"),
      BIWEEKLY: t("fixed_expenses.frequency.biweekly"),
      MONTHLY: t("fixed_expenses.frequency.monthly"),
      BIMONTHLY: t("fixed_expenses.frequency.bimonthly"),
      QUARTERLY: t("fixed_expenses.frequency.quarterly"),
      YEARLY: t("fixed_expenses.frequency.yearly"),
    })[f]
  const create = useCreateFixedExpense()
  const update = useUpdateFixedExpense()
  const absorb = useAbsorbInvoice()
  const isEdit = Boolean(expense)
  const pending = create.isPending || update.isPending

  // Drawer flow only: offer linking this invoice to an existing expense.
  const canLinkExisting = Boolean(linkInvoiceId) && !isEdit
  const existingList = useFixedExpensesList(canLinkExisting)
  const existing = existingList.data?.expenses ?? []
  // Which existing expense is selected ("" = none, i.e. create a new one).
  const [selectedId, setSelectedId] = useState("")
  const selected = existing.find((e) => e.id === selectedId) ?? null
  const locked = Boolean(selected)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const createDefaults: FormValues = {
    name: prefill?.name ?? "",
    category: prefill?.category ?? "UNCATEGORIZED",
    vendorName: prefill?.vendorName ?? "",
    senderEmail: prefill?.senderEmail ?? "",
    gmailCredentialId: prefill?.gmailCredentialId ?? "",
    expectedAmount: prefill?.expectedAmount ?? "",
    currency: prefill?.currency ?? "USD",
    frequency: prefill?.frequency ?? "MONTHLY",
    anchorDate: prefill?.anchorDate ?? format(new Date(), "yyyy-MM-dd"),
    gracePeriodDays: prefill?.gracePeriodDays ?? "5",
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: expense
      ? {
          name: expense.name,
          category: expense.category,
          vendorName: expense.vendorName.join(", "),
          senderEmail: expense.senderEmail.join(", "),
          gmailCredentialId: expense.gmailCredentialId ?? "",
          expectedAmount: expense.expectedAmount ?? "",
          currency: expense.currency,
          frequency: expense.frequency,
          anchorDate: expense.anchorDate.slice(0, 10),
          gracePeriodDays: String(expense.gracePeriodDays),
        }
      : createDefaults,
  })

  // Selecting an existing expense fills + locks the form (preview only — on save
  // we link rather than create). "" returns to the create defaults.
  function onSelectExisting(value: string | null) {
    const id = value ?? ""
    setSelectedId(id)
    const e = existing.find((x) => x.id === id)
    reset(
      e
        ? {
            name: e.name,
            category: e.category,
            vendorName: e.vendorName.join(", "),
            senderEmail: e.senderEmail.join(", "),
            gmailCredentialId: e.gmailCredentialId ?? "",
            expectedAmount: e.expectedAmount ?? "",
            currency: e.currency,
            frequency: e.frequency,
            anchorDate: e.anchorDate.slice(0, 10),
            gracePeriodDays: String(e.gracePeriodDays),
          }
        : createDefaults,
    )
  }

  function onSubmit(v: FormValues) {
    const base = {
      name: v.name.trim(),
      category: v.category,
      vendorName: parseList(v.vendorName),
      senderEmail: parseList(v.senderEmail),
      gmailCredentialId: v.gmailCredentialId || null,
      expectedAmount: v.expectedAmount.trim() || null,
      currency: v.currency.trim(),
      frequency: v.frequency,
      anchorDate: v.anchorDate,
      gracePeriodDays: Number(v.gracePeriodDays) || 0,
    }

    if (expense) {
      update.mutate(
        { id: expense.id, data: base },
        { onSuccess: () => { track("fixed_expense_saved", { mode: "edit" }); onSaved(); onClose() } },
      )
    } else {
      create.mutate(
        { ...base, ...(linkInvoiceId ? { linkInvoiceId } : {}) },
        { onSuccess: () => { track("fixed_expense_saved", { mode: "create", linkedInvoice: Boolean(linkInvoiceId) }); onSaved(); onClose() } },
      )
    }
  }

  // Confirmed "Link": absorb this invoice into the selected existing expense.
  function confirmLink() {
    if (!selected || !linkInvoiceId) return
    absorb.mutate(
      { id: selected.id, invoiceId: linkInvoiceId },
      { onSuccess: () => { setConfirmOpen(false); onSaved(); onClose() } },
    )
  }

  return (
    <>
    <FormDialog
      className="sm:max-w-115"
      footerClassName="gap-[8px]"
      title={isEdit ? t("fixed_expenses.form.title_edit") : t("fixed_expenses.form.title_new")}
      description={t("fixed_expenses.form.description")}
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={pending || absorb.isPending}
          >
            {t("fixed_expenses.form.cancel")}
          </Button>
          {locked ? (
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={absorb.isPending}
            >
              {t("fixed_expenses.form.link")}
            </Button>
          ) : (
            <Button type="submit" disabled={pending}>
              {pending ? t("fixed_expenses.form.saving") : isEdit ? t("fixed_expenses.form.save_changes") : t("fixed_expenses.form.create")}
            </Button>
          )}
        </>
      }
    >
        <div className="px-5.5 py-4.5 flex flex-col gap-3.25 max-h-[62vh] overflow-y-auto">
          {/* Link to an existing expense (drawer flow, only when some exist) */}
          {canLinkExisting && existing.length > 0 && (
            <div className="flex flex-col gap-1.25">
              <Label className={fieldLabel}>{t("fixed_expenses.form.link_existing_label")}</Label>
              <Select
                items={[
                  { value: "", label: t("fixed_expenses.form.create_new_option") },
                  ...existing.map((e) => ({ value: e.id, label: e.name })),
                ]}
                value={selectedId}
                onValueChange={onSelectExisting}
              >
                <SelectTrigger className={fieldTrigger}>
                  <SelectValue placeholder={t("fixed_expenses.form.create_new_placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("fixed_expenses.form.create_new_option")}</SelectItem>
                  {existing.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-dim">
                {t("fixed_expenses.form.link_existing_help")}
              </p>
            </div>
          )}

          {/* Fields lock when an existing expense is selected (preview only). */}
          <fieldset disabled={locked} className="contents">
          {/* Name */}
          <div className="flex flex-col gap-1.25">
            <Label htmlFor="fx-name" className={fieldLabel}>{t("fixed_expenses.form.name_label")}</Label>
            <Input id="fx-name" placeholder={t("fixed_expenses.form.name_placeholder")} className={fieldInput} {...register("name")} />
            {errors.name && <p className="text-xs text-danger">{errors.name.message}</p>}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.25">
            <Label className={fieldLabel}>{t("fixed_expenses.form.category_label")}</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  items={CATEGORY_SELECTABLE.map((c) => ({ value: c, label: t(`categories.${c}`) }))}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as InvoiceCategory)}
                >
                  <SelectTrigger className={fieldTrigger}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_SELECTABLE.map((c) => (
                      <SelectItem key={c} value={c}>{t(`categories.${c}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Source: vendor + sender */}
          <div className="flex flex-col gap-1.25">
            <Label htmlFor="fx-vendor" className={fieldLabel}>{t("fixed_expenses.form.vendor_label")}</Label>
            <Input id="fx-vendor" placeholder={t("fixed_expenses.form.vendor_placeholder")} className={fieldInput} {...register("vendorName")} />
            {errors.vendorName && <p className="text-xs text-danger">{errors.vendorName.message}</p>}
          </div>
          <div className="flex flex-col gap-1.25">
            <Label htmlFor="fx-sender" className={fieldLabel}>{t("fixed_expenses.form.sender_label")}</Label>
            <Input id="fx-sender" placeholder={t("fixed_expenses.form.sender_placeholder")} className={fieldInput} {...register("senderEmail")} />
            {errors.senderEmail && <p className="text-xs text-danger">{errors.senderEmail.message}</p>}
          </div>

          {/* Mailbox pin (optional) */}
          {mailboxes.length > 0 && (
            <div className="flex flex-col gap-1.25">
              <Label className={fieldLabel}>{t("fixed_expenses.form.mailbox_label")}</Label>
              <Controller
                control={control}
                name="gmailCredentialId"
                render={({ field }) => (
                  <Select
                    items={[{ value: "", label: t("fixed_expenses.form.any_mailbox") }, ...mailboxes.map((m) => ({ value: m.id, label: m.label }))]}
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger className={fieldTrigger}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t("fixed_expenses.form.any_mailbox")}</SelectItem>
                      {mailboxes.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Expected amount + currency */}
          <div className="flex gap-2.5">
            <div className="flex flex-col gap-1.25 flex-1">
              <Label htmlFor="fx-amount" className={fieldLabel}>{t("fixed_expenses.form.amount_label")}</Label>
              <Input id="fx-amount" inputMode="decimal" placeholder="0.00" className={fieldInput} {...register("expectedAmount")} />
              {errors.expectedAmount && <p className="text-xs text-danger">{errors.expectedAmount.message}</p>}
            </div>
            <div className="flex flex-col gap-1.25 w-22.5">
              <Label htmlFor="fx-currency" className={fieldLabel}>{t("fixed_expenses.form.currency_label")}</Label>
              <Input id="fx-currency" className={fieldInput} {...register("currency")} />
            </div>
          </div>

          {/* Frequency + anchor date */}
          <div className="flex gap-2.5">
            <div className="flex flex-col gap-1.25 flex-1">
              <Label className={fieldLabel}>{t("fixed_expenses.form.frequency_label")}</Label>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <Select
                    items={FIXED_EXPENSE_FREQUENCIES.map((f) => ({ value: f, label: freqLabel(f) }))}
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger className={fieldTrigger}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIXED_EXPENSE_FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>{freqLabel(f)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-1.25 flex-1">
              <Label htmlFor="fx-anchor" className={fieldLabel}>{t("fixed_expenses.form.anchor_label")}</Label>
              <Input id="fx-anchor" type="date" className={fieldInput} {...register("anchorDate")} />
              {errors.anchorDate && <p className="text-xs text-danger">{errors.anchorDate.message}</p>}
            </div>
          </div>

          {/* Grace period */}
          <div className="flex flex-col gap-1.25">
            <Label htmlFor="fx-grace" className={fieldLabel}>{t("fixed_expenses.form.grace_label")}</Label>
            <Input id="fx-grace" type="number" min="0" max="60" className={`${fieldInput} w-27.5`} {...register("gracePeriodDays")} />
            <p className="text-xs text-dim">{t("fixed_expenses.form.grace_help")}</p>
          </div>
          </fieldset>
        </div>
    </FormDialog>

      {/* Confirm absorbing this invoice into the selected existing expense. */}
      <Dialog name="fixed_expense_link_existing_confirm" open={confirmOpen} onOpenChange={(open) => { if (!open) setConfirmOpen(false) }}>
        <DialogContent className="sm:max-w-110">
          <DialogHeader>
            <DialogTitle>{t("fixed_expenses.link_confirm.title", { name: selected?.name ?? "" })}</DialogTitle>
            <DialogDescription>
              {t("fixed_expenses.link_confirm.body", {
                name: selected?.name ?? "",
                sender: prefill?.senderEmail
                  ? t("fixed_expenses.link_confirm.sender_fragment", { sender: prefill.senderEmail })
                  : "",
                title:
                  prefill?.vendorName || prefill?.name
                    ? t("fixed_expenses.link_confirm.title_fragment", {
                        title: prefill?.vendorName || prefill?.name || "",
                      })
                    : "",
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={absorb.isPending}
            >
              {t("fixed_expenses.form.cancel")}
            </Button>
            <Button
              type="button"
              onClick={confirmLink}
              disabled={absorb.isPending}
            >
              {absorb.isPending ? t("fixed_expenses.link_confirm.linking") : t("fixed_expenses.link_confirm.link_invoice")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
