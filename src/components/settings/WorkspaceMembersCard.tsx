"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Member, MemberRole } from "@/api-types/settings";

interface WorkspaceMembersCardProps {
  members: Member[];
}

const ROLE_META: Record<
  MemberRole,
  { label: string; color: string; bg: string }
> = {
  OWNER: { label: "Owner", color: "#7C3AED", bg: "#F5F3FF" },
  ADMIN: { label: "Admin", color: "#3B6FE0", bg: "#EFF6FF" },
  MEMBER: { label: "Member", color: "#64748B", bg: "#F1F3F8" },
};

function initials(member: Member): string {
  if (member.name) {
    return member.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return member.email[0]?.toUpperCase() ?? "?";
}

export function WorkspaceMembersCard({ members }: WorkspaceMembersCardProps) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none h-full rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex-1 flex flex-col">
        <h2 className="text-[16px] font-[700] text-heading leading-none mb-[18px]">
          Workspace &amp; members
        </h2>

        <div className="flex flex-col gap-[14px]">
          {members.map((member) => {
            const role = ROLE_META[member.role];
            return (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar className="size-[38px]">
                  <AvatarFallback
                    className="text-[12.5px] font-[700] text-white"
                    style={{
                      background: "linear-gradient(135deg, #A78BFA, #7AA7FF)",
                    }}
                  >
                    {initials(member)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-[700] text-heading truncate leading-tight">
                    {member.name ?? member.email}
                  </p>
                  <p className="text-[12.5px] text-text-secondary truncate">
                    {member.email}
                  </p>
                </div>
                <Badge
                  className="shrink-0 h-auto rounded-full text-[12px] font-[700] px-[11px] py-[3px]"
                  style={{ background: role.bg, color: role.color }}
                >
                  {role.label}
                </Badge>
              </div>
            );
          })}
        </div>
        <div className="mt-auto pt-[18px] flex w-full">
          <Button
            variant="outline"
            disabled
            title="Member invites are coming soon"
            className="w-full h-auto text-[13.5px] font-[600] text-text-secondary border-dashed border-[#CBD5E1] rounded-[11px] py-[11px] bg-transparent hover:bg-hover"
          >
            + Invite member
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
