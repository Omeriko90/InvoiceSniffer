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
import { SUPPORTED_DISPLAY_CURRENCIES, CURRENCY_SYMBOLS } from "@/lib/currency";
import { useUpdateDisplayCurrency } from "@/hooks/useUpdateDisplayCurrency";
import { useT } from "@/components/i18n/LocaleProvider";

export function CurrencyPreferenceCard({
  displayCurrency,
}: {
  displayCurrency: string;
}) {
  const t = useT();
  const [value, setValue] = useState(displayCurrency);
  const update = useUpdateDisplayCurrency();

  const dirty = value !== displayCurrency;

  function save() {
    update.mutate(value, {
      onSuccess: () => toast.success(t("settings.currency.saved")),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : t("settings.currency.saveFailed")),
    });
  }

  return (
    <Card className="h-full ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5 flex flex-col h-full">
        <h2 className="text-base font-bold text-heading leading-none mb-1.5">
          {t("settings.currency.title")}
        </h2>
        <p className="text-xs text-text-secondary mb-[18px] leading-[1.55]">
          {t("settings.currency.description")}
        </p>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-text-primary">
            {t("settings.currency.label")}
          </label>
          <Select
            value={value}
            onValueChange={(v) => {
              if (v) setValue(v);
            }}
          >
            <SelectTrigger className="h-auto py-[7px] px-2.5 w-[120px] rounded border-border text-sm font-semibold text-text-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_DISPLAY_CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CURRENCY_SYMBOLS[c] ? `${c} (${CURRENCY_SYMBOLS[c]})` : c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-auto pt-4">
          <Button
            onClick={save}
            disabled={!dirty || update.isPending}
          >
            {update.isPending ? t("settings.currency.saving") : t("settings.currency.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
