// Client component by import — only ever rendered from <InvoicesClient>.
import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  ChevronRight,
  Clock,
  ExternalLink,
  EyeOff,
  FileText,
  FileX,
  Lock,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUpdateInvoice } from "@/hooks/useUpdateInvoice";
import { useRemoveInvoice } from "@/hooks/useRemoveInvoice";
import { useUnlinkFixedExpense } from "@/hooks/useUnlinkFixedExpense";
import type { RemovalReason } from "@/api/invoices";
import { fmtMoney, fmtDisplayMoney, hasDistinctOriginal } from "@/lib/money";
import { fmtAmount, fmtSize, toDraft } from "../helpers";
import type { InvoiceRow } from "../types";
import { VendorCell } from "../VendorCell";
import { CategoryBadge } from "../CategoryBadge";
import { DocumentTypeBadge } from "../DocumentTypeBadge";
import {
  CATEGORY_LABELS,
  CATEGORY_SELECTABLE,
  type InvoiceCategory,
} from "@/lib/invoice-categories";
import {
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_SELECTABLE,
  type DocumentType,
} from "@/lib/document-types";
import { FixedExpenseFormDialog } from "@/components/fixed-expenses/FixedExpenseFormDialog";
import { track } from "@/lib/analytics";
import { InvoiceDetailDrawerHeader } from "./InvoiceDetailDrawerHeader";
import { InvoiceDetail } from "./InvoiceDetail";
import { InvoiceDetailsForm } from "./InvoiceDetailsForm";

export function InvoiceDetailDrawer({
  invoice,
  onSaved,
  onDismiss,
}: {
  invoice: InvoiceRow;
  onSaved: (updated: InvoiceRow) => void;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [unlinkOpen, setUnlinkOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(() => toDraft(invoice));
  const [categoryDraft, setCategoryDraft] = useState<InvoiceCategory>(
    invoice.category,
  );
  const [documentTypeDraft, setDocumentTypeDraft] = useState<DocumentType>(
    invoice.documentType,
  );
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

  const amountValid =
    draft.totalAmount.trim() !== "" &&
    Number.isFinite(Number(draft.totalAmount)) &&
    Number(draft.totalAmount) >= 0;

  function setField(field: keyof ReturnType<typeof toDraft>, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
  }

  function handleUnlink() {
    unlink(invoice.id);
  }

  function handleSave() {
    const data = {
      vendorName: draft.vendorName.trim() || null,
      invoiceNumber: draft.invoiceNumber.trim() || null,
      totalAmount: draft.totalAmount.trim(),
      invoiceDate: draft.invoiceDate || null,
      dueDate: draft.dueDate || null,
      category: categoryDraft,
      documentType: documentTypeDraft,
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
      className="w-125 sm:max-w-125 gap-0 bg-white border-l border-border"
      style={{ boxShadow: "-12px 0 40px rgba(80,110,180,.12)" }}
    >
      <InvoiceDetailDrawerHeader vendor={vendor} invoice={invoice} />

      {editing ? (
        <InvoiceDetailsForm
          invoice={invoice}
          draft={draft}
          onFieldChange={setField}
          onDocumentTypeChange={setDocumentTypeDraft}
          onCategoryChange={setCategoryDraft}
          documentType={documentTypeDraft}
          category={categoryDraft}
          isPending={update.isPending}
          onCancel={() => setEditing(false)}
          onSave={handleSave}
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
              ? "Mark as not an invoice?"
              : "Remove this invoice?"
          }
          description={
            confirmReason === "NOT_AN_INVOICE"
              ? "It's removed from your list and similar emails from this sender are detected less often. You can undo this."
              : "It genuinely is an invoice but won't appear in your list. You can undo this."
          }
          confirmLabel="Remove"
          pendingLabel="Removing…"
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
              Also stop showing invoices from this sender
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
          title="Remove from fixed expense?"
          description={
            <>
              This invoice will no longer count toward
              {invoice.fixedExpense
                ? ` “${invoice.fixedExpense.name}”`
                : " this fixed expense"}
              . The fixed expense keeps its match rules, so a matching invoice
              can re-link later.
            </>
          }
          confirmLabel="Remove"
          pendingLabel="Removing…"
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
              Also stop showing invoices from this sender
            </Label>
          )}
        </ConfirmationDialog>
      )}
    </SheetContent>
  );
}
