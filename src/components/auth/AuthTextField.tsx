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
    <div className={cn("flex flex-col gap-[6px]", wrapperClassName)}>
      {labelAccessory ? (
        <div className="flex items-center justify-between">
          <Label className="text-[12.5px] font-[600] text-[#475569]" htmlFor={id}>{label}</Label>
          {labelAccessory}
        </div>
      ) : (
        <Label className="text-[12.5px] font-[600] text-[#475569]" htmlFor={id}>{label}</Label>
      )}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className="rounded-[10px] border-[#E8EDFA] h-[42px] text-[14px]"
        aria-invalid={!!error}
        {...registration}
      />
      {error && <p className="text-[12px] text-destructive">{error}</p>}
    </div>
  )
}
