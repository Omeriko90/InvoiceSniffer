// Client component by import — only ever rendered from auth forms.
import { Button } from "@/components/ui/button"
import { GoogleLogo } from "./GoogleLogo"

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full gap-2.5 rounded-[11px] border-border text-sm font-semibold mb-5"
      onClick={onClick}
    >
      <GoogleLogo />
      Continue with Google
    </Button>
  )
}
