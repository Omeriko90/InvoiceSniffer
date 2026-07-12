// Client component by import — only ever rendered from ReconcileClient
import { format } from "date-fns";
import { ArrowDown, CreditCard, ExternalLink, FileText } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { fmtMoney } from "@/lib/money";
import type { TransactionRow } from "@/components/reconcile/ReconcileClient";

type RunAction = "confirm" | "reject" | "no_invoice" | "undo";

// ── Comparison helpers ───────────────────────────────────────────────

function fmtDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}

function Field({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex flex-col justify-between gap-[2px] bg-white px-[15px] py-[13px]">
      <span className="text-[10.5px] font-[700] uppercase tracking-[0.05em] text-[#94A3B8]">
        {label}
      </span>
      <span
        className="text-lg font-[600]"
        style={{ color: muted ? "#94A3B8" : "#334155" }}
      >
        {value}
      </span>
    </div>
  );
}

function Panel({
  icon,
  title,
  subtitle,
  children,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0 border border-[#E8EDFA] rounded-[13px] overflow-hidden">
      <div className="flex items-center gap-[9px] px-[15px] py-[12px] border-b border-[#F1F3F8]">
        <div
          className="w-[30px] h-[30px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ background: accent }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-[700] text-heading truncate">
            {title}
          </p>
          <p className="text-[11px] text-[#94A3B8] truncate">{subtitle}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 flex-1 gap-px bg-[#F1F3F8]">
        {children}
      </div>
    </div>
  );
}

// ── Action buttons ───────────────────────────────────────────────────

type BtnVariant = "outline" | "neutral" | "green" | "blue";

const BTN_STYLES: Record<BtnVariant, React.CSSProperties> = {
  outline: {
    border: "1px solid #E8EDFA",
    background: "#fff",
    color: "#94A3B8",
  },
  neutral: {
    border: "1px solid #E8EDFA",
    background: "#fff",
    color: "#475569",
  },
  green: { border: "1px solid #34D399", background: "#34D399", color: "#fff" },
  blue: { border: "1px solid #7AA7FF", background: "#7AA7FF", color: "#fff" },
};

function DrawerButton({
  variant,
  onClick,
  disabled,
  children,
}: {
  variant: BtnVariant;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 text-[13px] font-[700] px-[14px] py-[10px] rounded-[10px] cursor-pointer transition-[filter] hover:brightness-[1.04] disabled:opacity-50 disabled:cursor-default"
      style={BTN_STYLES[variant]}
    >
      {children}
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────

export function MatchDrawer({
  transaction,
  onClose,
  onRun,
  onFind,
  pending,
}: {
  transaction: TransactionRow | null;
  onClose: () => void;
  onRun: (id: string, action: RunAction) => void;
  onFind: (txn: TransactionRow) => void;
  pending: boolean;
}) {
  return (
    <Sheet
      open={!!transaction}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {transaction && (
        <SheetContent
          side="right"
          className="data-[side=right]:w-full data-[side=right]:sm:max-w-[500px] bg-white border-[#E8EDFA] p-0 gap-0"
        >
          <Body
            transaction={transaction}
            onRun={onRun}
            onFind={onFind}
            pending={pending}
          />
        </SheetContent>
      )}
    </Sheet>
  );
}

function Body({
  transaction,
  onRun,
  onFind,
  pending,
}: {
  transaction: TransactionRow;
  onRun: (id: string, action: RunAction) => void;
  onFind: (txn: TransactionRow) => void;
  pending: boolean;
}) {
  const { invoice } = transaction;
  const pct =
    transaction.matchConfidence !== null
      ? Math.round(transaction.matchConfidence * 100)
      : null;

  // Match signal — do the two sides agree on amount / date?
  const amountMatch = invoice
    ? Math.abs(Number(transaction.amount) - Number(invoice.amount)) < 0.01
    : false;

  return (
    <>
      <SheetHeader className="px-[22px] pt-[20px] pb-[16px] border-b border-[#F1F3F8]">
        <SheetTitle className="text-[16px] font-[700] text-heading">
          {invoice ? "Confirm this match" : "Transaction detail"}
        </SheetTitle>
        <SheetDescription className="text-[12.5px] text-[#64748B]">
          {invoice
            ? "Check that the invoice matches this charge before confirming."
            : "No invoice is linked to this charge yet."}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-[22px] py-[18px] flex flex-col gap-[16px]">
        {/* Confidence banner */}
        {pct !== null &&
          (transaction.status === "MATCHED" ||
            transaction.status === "POSSIBLE") && (
            <div className="flex items-center gap-[10px] bg-[#F8FAFF] border border-[#E8EDFA] rounded-[11px] px-[14px] py-[11px]">
              <div className="flex-1">
                <p className="text-[11px] font-[700] uppercase tracking-[0.05em] text-[#64748B] mb-[5px]">
                  Match confidence
                </p>
                <div className="flex items-center gap-[8px]">
                  <div className="flex-1 h-[6px] bg-[#F1F3F8] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          pct >= 85
                            ? "#34D399"
                            : pct >= 55
                              ? "#FBBF24"
                              : "#FB7171",
                      }}
                    />
                  </div>
                  <span className="text-[12px] font-[700] text-[#334155]">
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
          )}
        {transaction.matchReason && (
          <p className="text-[12.5px] text-[#64748B] -mt-[8px]">
            {transaction.matchReason}
          </p>
        )}

        {/* Side-by-side comparison */}
        <div className="flex flex-col flex-1 items-stretch gap-[12px]">
          <Panel
            icon={<CreditCard size={16} className="text-white" />}
            title="Bank charge"
            subtitle={transaction.sourceFile ?? "Imported transaction"}
            accent="#7AA7FF"
          >
            <Field label="Merchant" value={transaction.merchant} />
            <Field
              label="Amount"
              value={fmtMoney(transaction.amount, transaction.currency)}
            />
            <Field label="Date" value={fmtDate(transaction.date)} />
            <Field label="Currency" value={transaction.currency} />
          </Panel>

          <div className="hidden sm:flex items-center justify-center shrink-0">
            <div className="w-[28px] h-[28px] rounded-full bg-[#EEF3FF] flex items-center justify-center">
              <ArrowDown size={15} className="text-[#7AA7FF]" />
            </div>
          </div>

          {invoice ? (
            <Panel
              icon={<FileText size={16} className="text-white" />}
              title={invoice.vendorName ?? "Unknown vendor"}
              subtitle={invoice.senderEmail}
              accent="#34D399"
            >
              <Field
                label="Invoice #"
                value={invoice.invoiceNumber ?? "—"}
                muted={!invoice.invoiceNumber}
              />
              <Field
                label="Amount"
                value={fmtMoney(invoice.amount, invoice.currency)}
              />
              <Field label="Invoice date" value={fmtDate(invoice.date)} />
              <Field
                label="Due date"
                value={invoice.dueDate ? fmtDate(invoice.dueDate) : "—"}
                muted={!invoice.dueDate}
              />
            </Panel>
          ) : (
            <div className="flex-1 border border-dashed border-[#E8EDFA] rounded-[13px] flex flex-col items-center justify-center py-[28px] px-[16px] text-center">
              <FileText
                size={22}
                strokeWidth={1.5}
                className="text-[#CBD5E1] mb-[8px]"
              />
              <p className="text-[13px] font-[600] text-[#94A3B8]">
                No invoice linked
              </p>
            </div>
          )}
        </div>

        {/* Match checks */}
        {invoice && (
          <div className="flex flex-wrap gap-[8px]">
            <CheckChip
              ok={amountMatch}
              label={amountMatch ? "Amounts match" : "Amounts differ"}
            />
            {transaction.currency !== invoice.currency && (
              <CheckChip ok={false} label="Currencies differ" />
            )}
          </div>
        )}

        {/* Gmail link */}
        {invoice && (
          <a
            href={invoice.gmailLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[7px] text-[12.5px] font-[600] text-[#3B6FE0] hover:underline w-fit"
          >
            <ExternalLink size={13} />
            View source email
          </a>
        )}
      </div>

      {/* Footer actions */}
      <div className="border-t border-[#F1F3F8] px-[22px] py-[16px] flex gap-[8px]">
        {transaction.status === "MATCHED" && !transaction.matchConfirmed && (
          <>
            <DrawerButton
              variant="outline"
              disabled={pending}
              onClick={() => onRun(transaction.id, "reject")}
            >
              ✕ Reject match
            </DrawerButton>
            <DrawerButton
              variant="green"
              disabled={pending}
              onClick={() => onRun(transaction.id, "confirm")}
            >
              ✓ Confirm match
            </DrawerButton>
          </>
        )}
        {transaction.status === "MATCHED" && transaction.matchConfirmed && (
          <DrawerButton
            variant="outline"
            disabled={pending}
            onClick={() => onRun(transaction.id, "undo")}
          >
            Undo confirmation
          </DrawerButton>
        )}
        {transaction.status === "POSSIBLE" && (
          <>
            <DrawerButton
              variant="neutral"
              disabled={pending}
              onClick={() => onFind(transaction)}
            >
              Change invoice
            </DrawerButton>
            <DrawerButton
              variant="blue"
              disabled={pending}
              onClick={() => onRun(transaction.id, "confirm")}
            >
              Confirm match
            </DrawerButton>
          </>
        )}
        {transaction.status === "UNMATCHED" && (
          <>
            <DrawerButton
              variant="outline"
              disabled={pending}
              onClick={() => onRun(transaction.id, "no_invoice")}
            >
              No invoice needed
            </DrawerButton>
            <DrawerButton
              variant="blue"
              disabled={pending}
              onClick={() => onFind(transaction)}
            >
              Find invoice
            </DrawerButton>
          </>
        )}
        {transaction.status === "NO_INVOICE" && (
          <DrawerButton
            variant="outline"
            disabled={pending}
            onClick={() => onRun(transaction.id, "undo")}
          >
            Undo
          </DrawerButton>
        )}
      </div>
    </>
  );
}

function CheckChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className="text-[11.5px] font-[700] px-[10px] py-[4px] rounded-full"
      style={
        ok
          ? { background: "#ECFDF5", color: "#059669" }
          : { background: "#FEF2F2", color: "#DC2626" }
      }
    >
      {ok ? "✓ " : "✕ "}
      {label}
    </span>
  );
}
