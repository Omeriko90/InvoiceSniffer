// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { Button } from "@/components/ui/button"

export function InviteMemberButton() {
  return (
    <Button
      variant="outline"
      disabled
      title="Member invites are coming soon"
      className="w-full h-auto text-sm font-semibold text-text-secondary border-dashed border-faint rounded-[11px] py-[11px] bg-transparent hover:bg-hover"
    >
      + Invite member
    </Button>
  )
}
