// Client component by import — only ever rendered from <ImportWizard>.
import { useRef, useState } from "react"
import { Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DropzoneProps = {
  onFile: (file: File) => void
}

export function Dropzone({ onFile }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 rounded-[12px] border-2 border-dashed cursor-pointer transition-colors",
        dragging ? "border-primary bg-[rgba(122,167,255,0.06)]" : "border-border hover:border-primary/60 hover:bg-[rgba(122,167,255,0.03)]"
      )}
    >
      <div
        className="w-12 h-12 rounded-[14px] flex items-center justify-center text-white shadow-primary"
        style={{ background: "linear-gradient(135deg, #7AA7FF, #88D0FF)" }}
      >
        <Upload size={22} strokeWidth={2} />
      </div>
      <div className="text-center">
        <p className="text-[15px] font-[600] text-heading">
          Drag & drop your CSV here
        </p>
        <p className="text-[13px] text-text-secondary mt-1">
          Export transactions from your bank or card provider, then drop the file here.
        </p>
      </div>
      <Button variant="outline" size="sm" className="gap-1.5 text-[13px] mt-1 pointer-events-none">
        <FileText size={14} />
        Browse files
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="text/csv,.csv,application/vnd.ms-excel,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ""
        }}
      />
    </div>
  )
}
