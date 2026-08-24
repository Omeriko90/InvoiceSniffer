// Client component by import — only ever rendered from auth forms.
import { Button } from "@/components/ui/button"

export function AuthSubmitButton({ disabled, children }: {
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="submit"
      variant="gradientSky"
      size="xl"
      disabled={disabled}
      className="w-full"
    >
      {children}
    </Button>
  )
}
