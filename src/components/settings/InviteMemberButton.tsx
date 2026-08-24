// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { Button } from "@/components/ui/button"

export function InviteMemberButton() {
  return (
    <Button
      variant="ghost"
      disabled
      title="Member invites are coming soon"
      className="w-full border border-dashed border-faint"
    >
      + Invite member
    </Button>
  )
}
