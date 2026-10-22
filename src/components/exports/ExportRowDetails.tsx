"use client"

import { ExportHistoryItem } from "@/api/exports";
import { formatDate } from "date-fns";
import ExportRowDetail from "./ExportRowDetail";
import { Button } from "../ui/button";
import { Download } from "lucide-react";
import { useT } from "@/components/i18n/LocaleProvider";
import {
    downloadExport,
  } from "@/api/exports"

// Machine skip reasons (from the PDF build worker) → dictionary key.
const SKIP_REASON_KEY: Record<string, string> = {
    no_source: "exports.skipReason.noSource",
    // Retained so historical exports built before the rename still render.
    no_pdf_attachment: "exports.skipReason.noPdfAttachment",
    gmail_not_connected: "exports.skipReason.gmailNotConnected",
    fetch_or_parse_failed: "exports.skipReason.fetchOrParseFailed",
  }

  interface ExportRowDetailsProps {
    item: ExportHistoryItem;
  }



function ExportRowDetails({ item }: ExportRowDetailsProps) {
    const t = useT()
    const skipReasonLabel = (reason: string): string =>
      SKIP_REASON_KEY[reason] ? t(SKIP_REASON_KEY[reason] as never) : reason
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-white p-3.5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
          <ExportRowDetail label={t("exports.detail.invoices")} value={`${item.invoiceCount}`} />
          <ExportRowDetail label={t("exports.detail.skipped")} value={`${item.skippedCount}`} />
          <ExportRowDetail label={t("exports.detail.file")} value={item.fileName ?? t("exports.detail.empty")} />
          <ExportRowDetail
            label={t("exports.detail.expires")}
            value={item.expiresAt ? formatDate(new Date(item.expiresAt), "dd MMM yyyy") : t("exports.detail.empty")}
          />
        </dl>
  
        {item.skipped.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-bold tracking-tight text-text-secondary">
              {t("exports.skippedFiles")}
            </p>
            <ul className="flex flex-col gap-1">
              {item.skipped.map((s, i) => (
                <li
                  key={`${s.invoiceId}-${i}`}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="truncate font-semibold text-text-primary">
                    {s.vendorName ?? t("exports.unknownVendor")}
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
              {t("exports.download")}
            </Button>
          </div>
        )}
      </div>
    )
  }


  export default ExportRowDetails;