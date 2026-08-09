// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { Button } from "@/components/ui/components/buttons"

export function InviteMemberButton() {
  return (
    <Button
      variant="secondary"
      disabled
      title="Member invites are coming soon"
      className="w-full h-auto text-[13.5px] font-[600] text-text-secondary border-dashed border-[#CBD5E1] rounded-[11px] py-[11px] bg-transparent hover:bg-hover"
    >
      + Invite member
    </Button>
  )
}
