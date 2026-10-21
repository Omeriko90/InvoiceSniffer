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
import { useT } from "@/components/i18n/LocaleProvider";

const OPTIONS = [30, 45, 60, 90, 180];

// Org-level reconcile setting: how many days a card charge may post after its
// invoice. Widens the match window on the "invoice precedes charge" side so
// credit cards with a 30/60/90-day settlement lag still reconcile.
export function ReconcileSettingsCard({
  settlementLagDays,
}: {
  settlementLagDays: number;
}) {
  const t = useT();
  const [value, setValue] = useState(String(settlementLagDays));
  const update = useUpdateSettlementLag();

  const parsed = Number(value);
  const dirty = parsed !== settlementLagDays;

  function save() {
    update.mutate(parsed, {
      onSuccess: () => toast.success(t("settings.reconcile.saved")),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : t("settings.reconcile.saveFailed")),
    });
  }

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-base font-bold text-heading leading-none mb-1.5">
          {t("settings.reconcile.title")}
        </h2>
        <p className="text-xs text-text-secondary mb-[18px] leading-[1.55]">
          {t("settings.reconcile.description")}
        </p>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-text-primary">
            {t("settings.reconcile.settlementLagLabel")}
          </label>
          <Select
            value={value}
            onValueChange={(v) => {
              if (v) setValue(v);
            }}
          >
            <SelectTrigger className="h-auto py-[7px] px-2.5 w-[85px] rounded border-border text-sm font-semibold text-text-primary">
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
          <span>{t("settings.reconcile.days")}</span>
        </div>

        <div className="mt-4">
          <Button
            onClick={save}
            disabled={!dirty || update.isPending}
          >
            {update.isPending ? t("settings.reconcile.saving") : t("settings.reconcile.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
