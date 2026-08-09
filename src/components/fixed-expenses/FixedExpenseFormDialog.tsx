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
import { Button } from "@/components/ui/components/buttons"
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
  CATEGORY_LABELS,
  CATEGORY_SELECTABLE,
  INVOICE_CATEGORIES,
  type InvoiceCategory,
} from "@/lib/invoice-categories"
import { FIXED_EXPENSE_FREQUENCIES, FREQUENCY_LABELS } from "@/lib/fixed-expense-meta"
import type { FixedExpenseRow } from "./types"

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

const schema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    category: z.enum(INVOICE_CATEGORIES),
    vendorName: z.string().trim().max(200),
    senderEmail: z.string().trim().max(200),
    gmailCredentialId: z.string(),
    expectedAmount: z.string().trim(),
    currency: z.string().trim().min(1).max(8),
    frequency: z.enum(FIXED_EXPENSE_FREQUENCIES),
    anchorDate: z.string().min(1, "Pick a start date"),
    gracePeriodDays: z.string(),
  })
  .refine((v) => v.vendorName.trim() !== "" || v.senderEmail.trim() !== "", {
    message: "Add a vendor name or a sender email so we can match invoices",
    path: ["vendorName"],
  })
  .refine(
    (v) =>
      v.senderEmail.trim() === "" ||
      parseList(v.senderEmail).every((e) => z.string().email().safeParse(e).success),
    { message: "Enter valid email(s), comma-separated", path: ["senderEmail"] },
  )
  .refine((v) => v.expectedAmount.trim() === "" || /^\d+(\.\d{1,4})?$/.test(v.expectedAmount.trim()), {
    message: "Enter a valid amount",
    path: ["expectedAmount"],
  })

type FormValues = z.infer<typeof schema>

const fieldLabel = "text-[12px] font-[600] text-text-secondary"
const fieldInput =
  "h-auto px-[11px] py-[7px] text-[13px] text-text-primary border-border rounded-[9px]"
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
        { onSuccess: () => { onSaved(); onClose() } },
      )
    } else {
      create.mutate(
        { ...base, ...(linkInvoiceId ? { linkInvoiceId } : {}) },
        { onSuccess: () => { onSaved(); onClose() } },
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
      className="sm:max-w-[460px]"
      footerClassName="gap-[8px]"
      title={isEdit ? "Edit fixed expense" : "New fixed expense"}
      description="Track whether the expected invoice arrives each period."
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending || absorb.isPending}
            className="h-auto py-[8px] rounded-[10px] border-border bg-surface text-[13px] font-[600] text-text-primary"
          >
            Cancel
          </Button>
          {locked ? (
            <Button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={absorb.isPending}
              className="h-auto py-[8px] rounded-[10px] text-[13px] font-[600]"
            >
              Link
            </Button>
          ) : (
            <Button type="submit" disabled={pending} className="h-auto py-[8px] rounded-[10px] text-[13px] font-[600]">
              {pending ? "Saving…" : isEdit ? "Save changes" : "Create"}
            </Button>
          )}
        </>
      }
    >
        <div className="px-[22px] py-[18px] flex flex-col gap-[13px] max-h-[62vh] overflow-y-auto">
          {/* Link to an existing expense (drawer flow, only when some exist) */}
          {canLinkExisting && existing.length > 0 && (
            <div className="flex flex-col gap-[5px]">
              <Label className={fieldLabel}>Link to an existing fixed expense</Label>
              <Select
                items={[
                  { value: "", label: "— Create a new one —" },
                  ...existing.map((e) => ({ value: e.id, label: e.name })),
                ]}
                value={selectedId}
                onValueChange={onSelectExisting}
              >
                <SelectTrigger className={fieldTrigger}>
                  <SelectValue placeholder="Create a new one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— Create a new one —</SelectItem>
                  {existing.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-dim">
                Pick one to attach this invoice to it instead of creating a new expense.
              </p>
            </div>
          )}

          {/* Fields lock when an existing expense is selected (preview only). */}
          <fieldset disabled={locked} className="contents">
          {/* Name */}
          <div className="flex flex-col gap-[5px]">
            <Label htmlFor="fx-name" className={fieldLabel}>Name</Label>
            <Input id="fx-name" placeholder="e.g. AWS, Office rent" className={fieldInput} {...register("name")} />
            {errors.name && <p className="text-[11.5px] text-danger">{errors.name.message}</p>}
          </div>

          {/* Category */}
          <div className="flex flex-col gap-[5px]">
            <Label className={fieldLabel}>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  items={CATEGORY_SELECTABLE.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v as InvoiceCategory)}
                >
                  <SelectTrigger className={fieldTrigger}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_SELECTABLE.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Source: vendor + sender */}
          <div className="flex flex-col gap-[5px]">
            <Label htmlFor="fx-vendor" className={fieldLabel}>Vendor name</Label>
            <Input id="fx-vendor" placeholder="Who bills you (comma-separate several)" className={fieldInput} {...register("vendorName")} />
            {errors.vendorName && <p className="text-[11.5px] text-danger">{errors.vendorName.message}</p>}
          </div>
          <div className="flex flex-col gap-[5px]">
            <Label htmlFor="fx-sender" className={fieldLabel}>Sender email</Label>
            <Input id="fx-sender" placeholder="billing@vendor.com (comma-separate several)" className={fieldInput} {...register("senderEmail")} />
            {errors.senderEmail && <p className="text-[11.5px] text-danger">{errors.senderEmail.message}</p>}
          </div>

          {/* Mailbox pin (optional) */}
          {mailboxes.length > 0 && (
            <div className="flex flex-col gap-[5px]">
              <Label className={fieldLabel}>Mailbox (optional)</Label>
              <Controller
                control={control}
                name="gmailCredentialId"
                render={({ field }) => (
                  <Select
                    items={[{ value: "", label: "Any mailbox" }, ...mailboxes.map((m) => ({ value: m.id, label: m.label }))]}
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? "")}
                  >
                    <SelectTrigger className={fieldTrigger}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any mailbox</SelectItem>
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
          <div className="flex gap-[10px]">
            <div className="flex flex-col gap-[5px] flex-1">
              <Label htmlFor="fx-amount" className={fieldLabel}>Expected amount</Label>
              <Input id="fx-amount" inputMode="decimal" placeholder="0.00" className={fieldInput} {...register("expectedAmount")} />
              {errors.expectedAmount && <p className="text-[11.5px] text-danger">{errors.expectedAmount.message}</p>}
            </div>
            <div className="flex flex-col gap-[5px] w-[90px]">
              <Label htmlFor="fx-currency" className={fieldLabel}>Currency</Label>
              <Input id="fx-currency" className={fieldInput} {...register("currency")} />
            </div>
          </div>

          {/* Frequency + anchor date */}
          <div className="flex gap-[10px]">
            <div className="flex flex-col gap-[5px] flex-1">
              <Label className={fieldLabel}>Frequency</Label>
              <Controller
                control={control}
                name="frequency"
                render={({ field }) => (
                  <Select
                    items={FIXED_EXPENSE_FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger className={fieldTrigger}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FIXED_EXPENSE_FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>{FREQUENCY_LABELS[f]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-[5px] flex-1">
              <Label htmlFor="fx-anchor" className={fieldLabel}>First expected on</Label>
              <Input id="fx-anchor" type="date" className={fieldInput} {...register("anchorDate")} />
              {errors.anchorDate && <p className="text-[11.5px] text-danger">{errors.anchorDate.message}</p>}
            </div>
          </div>

          {/* Grace period */}
          <div className="flex flex-col gap-[5px]">
            <Label htmlFor="fx-grace" className={fieldLabel}>Grace period (days)</Label>
            <Input id="fx-grace" type="number" min="0" max="60" className={`${fieldInput} w-[110px]`} {...register("gracePeriodDays")} />
            <p className="text-[11px] text-dim">Days after the period ends before it counts as overdue.</p>
          </div>
          </fieldset>
        </div>
    </FormDialog>

      {/* Confirm absorbing this invoice into the selected existing expense. */}
      <Dialog open={confirmOpen} onOpenChange={(open) => { if (!open) setConfirmOpen(false) }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Link to “{selected?.name}”?</DialogTitle>
            <DialogDescription>
              This adds the sender{prefill?.senderEmail ? ` ${prefill.senderEmail}` : ""}
              {(prefill?.vendorName || prefill?.name) ? ` and title “${prefill?.vendorName || prefill?.name}”` : ""}{" "}
              to “{selected?.name}”, and marks past and future invoices from that sender as this
              fixed expense.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(false)}
              disabled={absorb.isPending}
              className="rounded-[10px] text-[13.5px] font-[600]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmLink}
              disabled={absorb.isPending}
              className="rounded-[10px] text-[13.5px] font-[700]"
            >
              {absorb.isPending ? "Linking…" : "Link invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
