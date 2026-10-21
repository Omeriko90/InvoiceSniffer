import { ExportHistoryItem } from "@/api/exports";
import { formatDate } from "date-fns";
import ExportRowDetail from "./ExportRowDetail";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import {
    downloadExport,
  } from "@/api/exports"

// Machine skip reasons (from the PDF build worker) → human copy.
const SKIP_REASON_LABEL: Record<string, string> = {
    no_source: "No attachment or email content to include",
    // Retained so historical exports built before the rename still render.
    no_pdf_attachment: "No PDF attachment on the email",
    gmail_not_connected: "Gmail account no longer connected",
    fetch_or_parse_failed: "Couldn't fetch or read the invoice",
  }
  
  function skipReasonLabel(reason: string): string {
    return SKIP_REASON_LABEL[reason] ?? reason
  }

  interface ExportRowDetailsProps {
    item: ExportHistoryItem;
  }



function ExportRowDetails({ item }: ExportRowDetailsProps) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3.5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <ExportRowDetail label="Invoices" value={`${item.invoiceCount}`} />
          <ExportRowDetail label="Skipped" value={`${item.skippedCount}`} />
          <ExportRowDetail label="File" value={item.fileName ?? "—"} />
          <ExportRowDetail
            label="Expires"
            value={item.expiresAt ? formatDate(new Date(item.expiresAt), "dd MMM yyyy") : "—"}
          />
        </dl>
  
        {item.skipped.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-bold tracking-tight text-text-secondary">
              Skipped files
            </p>
            <ul className="flex flex-col gap-1">
              {item.skipped.map((s, i) => (
                <li
                  key={`${s.invoiceId}-${i}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate font-semibold text-text-primary">
                    {s.vendorName ?? "Unknown vendor"}
                  </span>
                  <span className="shrink-0 text-text-secondary">{skipReasonLabel(s.reason)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
  
        {item.status === "READY" && (
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadExport(item.id)}
              className="gap-1.5"
            >
              <Download size={14} />
              Download
            </Button>
          </div>
        )}
      </div>
    )
  }


  export default ExportRowDetails;