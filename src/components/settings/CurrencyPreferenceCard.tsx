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

// Org-level display currency: every amount across the app is presented in this
// currency. Invoices in another currency are converted at arrival and stored, so
// changing this only affects invoices that arrive afterwards.
export function CurrencyPreferenceCard({
  displayCurrency,
}: {
  displayCurrency: string;
}) {
  const [value, setValue] = useState(displayCurrency);
  const update = useUpdateDisplayCurrency();

  const dirty = value !== displayCurrency;

  function save() {
    update.mutate(value, {
      onSuccess: () => toast.success("Display currency saved"),
      onError: (e) =>
        toast.error(e instanceof Error ? e.message : "Failed to save"),
    });
  }

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-base font-bold text-heading leading-none mb-1.5">
          Display currency
        </h2>
        <p className="text-xs text-text-secondary mb-[18px] leading-[1.55]">
          The currency all amounts are shown in. Invoices billed in another
          currency are converted at the exchange rate on the day they arrive.
          Changing this applies to invoices received from now on.
        </p>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-text-primary">
            Currency:
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

        <div className="mt-4">
          <Button
            onClick={save}
            disabled={!dirty || update.isPending}
          >
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
