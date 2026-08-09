// Client component by import — only ever rendered from auth forms.
import { Button } from "@/components/ui/components/buttons"
import { GoogleLogo } from "./GoogleLogo"

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full gap-[10px] rounded-[11px] border-[#E8EDFA] text-[14.5px] font-[600] mb-5"
      onClick={onClick}
    >
      <GoogleLogo />
      Continue with Google
    </Button>
  )
}
