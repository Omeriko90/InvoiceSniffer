"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Member } from "@/api-types/settings";
import { MemberRow } from "./MemberRow";
import { InviteMemberButton } from "./InviteMemberButton";

interface WorkspaceMembersCardProps {
  members: Member[];
}

export function WorkspaceMembersCard({ members }: WorkspaceMembersCardProps) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none h-full rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex-1 flex flex-col">
        <h2 className="text-[16px] font-[700] text-heading leading-none mb-[18px]">
          Workspace &amp; members
        </h2>

        <div className="flex flex-col gap-[14px]">
          {members.map((member) => (
            <MemberRow key={member.id} member={member} />
          ))}
        </div>
        <div className="mt-auto pt-[18px] flex w-full">
          <InviteMemberButton />
        </div>
      </CardContent>
    </Card>
  );
}
