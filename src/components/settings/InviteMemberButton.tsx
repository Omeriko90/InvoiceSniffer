// Client component by import — only ever rendered from <WorkspaceMembersCard>.
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n/LocaleProvider";

export function InviteMemberButton() {
  const t = useT();
  return (
    <Button
      variant="ghost"
      disabled
      title={t("settings.members.inviteComingSoon")}
      className="w-full border border-dashed border-faint"
    >
      {t("settings.members.invite")}
    </Button>
  );
}
