// Client component by import — only ever rendered from auth forms.
import { Separator } from "@/components/ui/separator"

export function OrDivider() {
  return (
    <div className="flex items-center gap-3 mb-5">
      <Separator className="flex-1" />
      <span className="text-xs font-medium text-dim">or</span>
      <Separator className="flex-1" />
    </div>
  )
}
