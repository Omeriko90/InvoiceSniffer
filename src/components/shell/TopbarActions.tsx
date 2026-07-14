// Client component by import — only ever rendered from <Topbar>.
import Link from "next/link"
import { Upload, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UploadCsvButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-[13px]"
      nativeButton={false}
      render={<Link href="/reconcile" />}
    >
      <Upload size={14} />
      Upload CSV
    </Button>
  )
}

export function NewExportButton() {
  return (
    <Button
      size="sm"
      className="gap-1.5 text-[13px] text-white shadow-primary border-0"
      style={{ background: "linear-gradient(135deg, #7AA7FF, #88D0FF)" }}
      nativeButton={false}
      render={<Link href="/exports" />}
    >
      <Download size={14} />
      New export
    </Button>
  )
}
