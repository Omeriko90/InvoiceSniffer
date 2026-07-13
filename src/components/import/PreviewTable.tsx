// Client component by import — only ever rendered from <ImportWizard>.
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatAmount } from "./helpers"
import { PreviewTableProps } from "./types"

export function PreviewTable({ rows, mapping }: PreviewTableProps) {
  return (
    <div>
      <p className="text-[12px] font-[700] text-text-secondary uppercase tracking-[0.04em] mb-2.5">
        Preview (first 3 rows)
      </p>
      <div className="border border-border rounded-[10px] overflow-hidden">
        <Table className="text-left">
          <TableHeader>
            <TableRow className="border-border bg-background hover:bg-background">
              <TableHead className="h-auto px-4 py-2.5 text-[11px] font-[700] text-dim uppercase tracking-[0.05em]">Date</TableHead>
              <TableHead className="h-auto px-4 py-2.5 text-[11px] font-[700] text-dim uppercase tracking-[0.05em]">Merchant</TableHead>
              <TableHead className="h-auto px-4 py-2.5 text-[11px] font-[700] text-dim uppercase tracking-[0.05em] text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i} className="border-border hover:bg-transparent">
                <TableCell className="px-4 py-2.5 text-[13px] font-mono text-text-primary">
                  {mapping.date ? row[mapping.date] : "—"}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-[13px] font-mono text-text-primary uppercase whitespace-normal">
                  {mapping.merchant ? row[mapping.merchant] : "—"}
                </TableCell>
                <TableCell className="px-4 py-2.5 text-[13.5px] font-[700] text-heading text-right">
                  {mapping.amount ? formatAmount(row[mapping.amount]) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
