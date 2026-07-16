// Client component by import — only ever rendered from <SettingsPage>.
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateSettlementLag } from "@/hooks/useUpdateSettlementLag";

const OPTIONS = [30, 45, 60, 90, 180];

// Org-level reconcile setting: how many days a card charge may post after its
// invoice. Widens the match window on the "invoice precedes charge" side so
// credit cards with a 30/60/90-day settlement lag still reconcile.
export function ReconcileSettingsCard({
  settlementLagDays,
}: {
  settlementLagDays: number;
}) {
  const [value, setValue] = useState(String(settlementLagDays));
  const update = useUpdateSettlementLag();

  const parsed = Number(value);
  const dirty = parsed !== settlementLagDays;

  function save() {
    update.mutate(parsed, {
      onSuccess: () => toast.success("Reconcile settings saved"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Failed to save"),
    });
  }

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-[16px] font-bold text-heading leading-none mb-[6px]">
          Reconcile settings
        </h2>
        <p className="text-[12.5px] text-text-secondary mb-[18px] leading-[1.55]">
          Credit-card settlement lag — how many days a charge may post after its
          invoice date. Increase this if your card bills 30, 60, or 90 days
          after purchase.
        </p>

        <div className="flex items-center gap-[10px]">
          <label className="flex items-center gap-[10px] text-[13px] font-[600] text-text-primary">
            Settlement lag:
          </label>
          <Select
            value={value}
            onValueChange={(v) => {
              if (v) setValue(v);
            }}
          >
            <SelectTrigger className="h-auto py-[7px] px-[10px] w-[85px] rounded border-border text-[13px] font-[600] text-text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPTIONS.map((o) => (
                <SelectItem key={o} value={String(o)}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>days</span>
        </div>

        <div className="mt-[16px]">
          <Button
            onClick={save}
            disabled={!dirty || update.isPending}
            className="h-auto text-[13px] font-[600] text-white bg-primary rounded-[9px] px-[16px] py-[8px] shadow-primary hover:bg-primary hover:opacity-90 disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
