// Client component by import — only ever rendered from auth forms.
import { Button } from "@/components/ui/button"

export function AuthSubmitButton({ disabled, children }: {
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={disabled}
      className="w-full text-base font-bold rounded-[11px] border-none text-white bg-gradient-sky shadow-primary"
    >
      {children}
    </Button>
  )
}
