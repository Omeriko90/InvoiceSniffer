// Client component by import — only ever rendered from auth forms.
import type { UseFormRegisterReturn } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AuthTextFieldProps {
  id: string
  label: string
  type?: string
  placeholder?: string
  error?: string
  registration: UseFormRegisterReturn
  wrapperClassName?: string
  labelAccessory?: React.ReactNode
}

export function AuthTextField({
  id,
  label,
  type,
  placeholder,
  error,
  registration,
  wrapperClassName,
  labelAccessory,
}: AuthTextFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {labelAccessory ? (
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold text-subtle" htmlFor={id}>{label}</Label>
          {labelAccessory}
        </div>
      ) : (
        <Label className="text-xs font-semibold text-subtle" htmlFor={id}>{label}</Label>
      )}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className="rounded-[10px] border-border h-[42px] text-sm"
        aria-invalid={!!error}
        {...registration}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
