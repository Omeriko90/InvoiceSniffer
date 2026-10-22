// Client component by import — only ever rendered from <InvoicesClient>.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SheetContent } from "@/components/ui/sheet";
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice";
import { useRemoveInvoice } from "@/hooks/useRemoveInvoice";
import { useUnlinkFixedExpense } from "@/hooks/useUnlinkFixedExpense";
import type { RemovalReason } from "@/api/invoices";
import type { InvoiceRow } from "../types";
import { FixedExpenseFormDialog } from "@/components/fixed-expenses/FixedExpenseFormDialog";
import { track } from "@/lib/analytics";
import { useT } from "@/components/i18n/LocaleProvider";
import { InvoiceDetailDrawerHeader } from "./InvoiceDetailDrawerHeader";
import { InvoiceDetail } from "./InvoiceDetail";
import { InvoiceDetailsForm, type InvoiceEditFormValues } from "./InvoiceDetailsForm";

export function InvoiceDetailDrawer({
  invoice,
  onSaved,
  onDismiss,
}: {
  invoice: InvoiceRow;
  onSaved: (updated: InvoiceRow) => void;
  onDismiss: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  // Which removal is awaiting confirmation (null = dialog closed), and whether
  // the user opted to also mute the sender (only offered for "not relevant").
  const [confirmReason, setConfirmReason] = useState<RemovalReason | null>(
    null,
  );
  const [muteSender, setMuteSender] = useState(false);
  const [markFixedOpen, setMarkFixedOpen] = useState(false);
  const update = useUpdateInvoice();
  const remove = useRemoveInvoice(() => router.refresh());
  const { mutate: unlink, isPending: unlinkPending } = useUnlinkFixedExpense(
    () => {
      track("invoice_unlinked", { invoiceId: invoice.id });
      setUnlinkOpen(false);
      router.refresh();
    },
  );

  function openConfirm(reason: RemovalReason) {
    setMuteSender(false);
    setConfirmReason(reason);
  }

  function handleRemove() {
    if (!confirmReason) return;
    remove.mutate(
      {
        id: invoice.id,
        reason: confirmReason,
        muteSender: confirmReason === "NOT_RELEVANT" ? muteSender : undefined,
      },
      {
        onSuccess: () => {
          setConfirmReason(null);
          onDismiss();
          router.refresh();
        },
      },
    );
  }

  const vendor =
    invoice.vendorName ?? invoice.senderName ?? invoice.senderEmail;

  function handleUnlink() {
    unlink(invoice.id);
  }

  function handleSave(values: InvoiceEditFormValues) {
    const data = {
      vendorName: values.vendorName.trim() || null,
      invoiceNumber: values.invoiceNumber.trim() || null,
      totalAmount: values.totalAmount.trim(),
      invoiceDate: values.invoiceDate || null,
      dueDate: values.dueDate || null,
      category: values.category,
      documentType: values.documentType,
    };
    update.mutate(
      { id: invoice.id, data },
      {
        onSuccess: () => {
          setEditing(false);
          onSaved({
            ...invoice,
            vendorName: data.vendorName,
            invoiceNumber: data.invoiceNumber,
            totalAmount: data.totalAmount,
            invoiceDate: data.invoiceDate
              ? new Date(data.invoiceDate).toISOString()
              : null,
            dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
            category: data.category,
            documentType: data.documentType,
          });
          router.refresh();
        },
      },
    );
  }

  return (
    <SheetContent
      side="right"
      forceOverlay
      className="w-125 sm:max-w-125 gap-0 bg-white border-s border-border"
      style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
    >
      <InvoiceDetailDrawerHeader vendor={vendor} invoice={invoice} />

      {editing ? (
        <InvoiceDetailsForm
          invoice={invoice}
          isPending={update.isPending}
          onCancel={() => setEditing(false)}
          onSubmit={handleSave}
        />
      ) : (
        <InvoiceDetail
          invoice={invoice}
          onUnlinkFixedExpense={handleUnlink}
          unlinkPending={unlinkPending}
          onEdit={() => setEditing(true)}
          onMarkFixedExpense={() => setMarkFixedOpen(true)}
          isPending={update.isPending}
          onOpenConfirm={openConfirm}
        />
      )}

      {/* Removal confirmation */}
      {confirmReason !== null && (
        <ConfirmationDialog
          open
          onOpenChange={() => setConfirmReason(null)}
          title={
            confirmReason === "NOT_AN_INVOICE"
              ? t("invoices.confirm.notInvoice.title")
              : t("invoices.confirm.remove.title")
          }
          description={
            confirmReason === "NOT_AN_INVOICE"
              ? t("invoices.confirm.notInvoice.description")
              : t("invoices.confirm.remove.description")
          }
          confirmLabel={t("invoices.confirm.removeLabel")}
          pendingLabel={t("invoices.confirm.removingLabel")}
          destructive
          isPending={remove.isPending}
          onConfirm={handleRemove}
        >
          {confirmReason === "NOT_RELEVANT" && (
            <Label
              htmlFor="mute-sender"
              className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer"
            >
              <Checkbox
                id="mute-sender"
                checked={muteSender}
                onCheckedChange={(checked) => setMuteSender(checked === true)}
              />
              {t("invoices.confirm.muteSender")}
            </Label>
          )}
        </ConfirmationDialog>
      )}

      {/* Mark as fixed expense — pre-filled from this invoice, links it on save */}
      {markFixedOpen && (
        <Dialog
          name="invoice_mark_fixed"
          open
          onOpenChange={(open) => {
            if (!open) setMarkFixedOpen(false);
          }}
        >
          {markFixedOpen && (
            <FixedExpenseFormDialog
              prefill={{
                name: invoice.vendorName ?? invoice.senderName ?? "",
                category: invoice.category,
                vendorName: invoice.vendorName ?? "",
                senderEmail: invoice.senderEmail,
                expectedAmount: invoice.totalAmount,
                currency: invoice.currency,
              }}
              linkInvoiceId={invoice.id}
              mailboxes={[]}
              onClose={() => setMarkFixedOpen(false)}
              onSaved={() => {
                track("invoice_marked_fixed", { invoiceId: invoice.id });
                router.refresh();
              }}
            />
          )}
        </Dialog>
      )}

      {/* Remove this invoice from its fixed expense */}
      {unlinkOpen && (
        <ConfirmationDialog
          open
          onOpenChange={(open) => {
            if (!open) setUnlinkOpen(false);
          }}
          title={t("invoices.confirm.unlink.title")}
          description={
            invoice.fixedExpense
              ? t("invoices.confirm.unlink.descriptionNamed", { name: invoice.fixedExpense.name })
              : t("invoices.confirm.unlink.description")
          }
          confirmLabel={t("invoices.confirm.removeLabel")}
          pendingLabel={t("invoices.confirm.removingLabel")}
          destructive
          isPending={unlinkPending}
          onConfirm={handleUnlink}
        >
          {confirmReason === "NOT_RELEVANT" && (
            <Label
              htmlFor="mute-sender"
              className="flex items-center gap-2 text-sm font-medium text-text-primary cursor-pointer"
            >
              <Checkbox
                id="mute-sender"
                checked={muteSender}
                onCheckedChange={(checked) => setMuteSender(checked === true)}
              />
              {t("invoices.confirm.muteSender")}
            </Label>
          )}
        </ConfirmationDialog>
      )}
    </SheetContent>
  );
}
