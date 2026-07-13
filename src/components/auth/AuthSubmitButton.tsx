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
      className="w-full text-[15px] font-[700] rounded-[11px] border-none text-white"
      style={{ background: "linear-gradient(135deg,#7AA7FF,#88D0FF)", boxShadow: "0 6px 16px rgba(122,167,255,.32)" }}
    >
      {children}
    </Button>
  )
}
