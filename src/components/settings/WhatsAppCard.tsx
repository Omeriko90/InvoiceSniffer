// Client component by import — only ever rendered from <SettingsPage>.
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { MessageCircle, Check, Trash2, ExternalLink } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useQueryClient } from "@tanstack/react-query"
import { queries } from "@/queries"
import { useRegisterWhatsApp } from "@/hooks/useRegisterWhatsApp"
import { useDeleteWhatsApp } from "@/hooks/useDeleteWhatsApp"
import type { WhatsAppNumberInfo, WhatsAppRegistration } from "@/api-types/settings"

interface WhatsAppCardProps {
  numbers: WhatsAppNumberInfo[]
  maxWhatsAppNumbers: number
}

export function WhatsAppCard({ numbers, maxWhatsAppNumbers }: WhatsAppCardProps) {
  const [phone, setPhone] = useState("")
  // The last registration response — carries the one-time code + wa.me link,
  // which the settings query never returns. Shown until that number verifies.
  const [pending, setPending] = useState<WhatsAppRegistration | null>(null)
  const register = useRegisterWhatsApp()
  const remove = useDeleteWhatsApp()
  const queryClient = useQueryClient()

  const atLimit = numbers.length >= maxWhatsAppNumbers
  const hasUnverified = numbers.some((n) => !n.verified)

  // Poll while a number is awaiting its code so the "Linked" flip shows without
  // a manual refresh.
  useEffect(() => {
    if (!hasUnverified) return
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: queries.settings.all.queryKey })
    }, 5000)
    return () => clearInterval(id)
  }, [hasUnverified, queryClient])

  // Show the one-time-code callout only while its number is still unverified —
  // derived so it clears itself once the number verifies (no setState in effect).
  const pendingCode =
    pending && !numbers.find((n) => n.id === pending.number.id)?.verified ? pending : null

  function add() {
    register.mutate(phone, {
      onSuccess: (reg) => {
        setPhone("")
        setPending(reg)
        toast.success("Number added — send the code to link it")
      },
      onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to add number"),
    })
  }

  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-5">
        <h2 className="text-base font-bold text-heading leading-none mb-1.5">WhatsApp</h2>
        <p className="text-xs text-text-secondary mb-[18px] leading-[1.55]">
          Send an invoice as a PDF or photo to our WhatsApp number and it shows up here. Add your
          phone, then send the code we give you to link it.
        </p>

        {numbers.length > 0 && (
          <div className="flex flex-col gap-2.5 mb-3.5">
            {numbers.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 rounded-[12px] border border-border bg-hover px-4 py-3"
              >
                <MessageCircle size={18} strokeWidth={2} className="text-success shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-heading font-mono">{n.phoneE164}</p>
                  <p className="text-xs mt-0.5">
                    {n.verified ? (
                      <span className="inline-flex items-center gap-1 text-success font-semibold">
                        <Check size={12} strokeWidth={2.5} /> Linked
                      </span>
                    ) : (
                      <span className="text-warning font-semibold">Pending verification</span>
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-dim hover:text-danger"
                  disabled={remove.isPending && remove.variables === n.id}
                  onClick={() =>
                    remove.mutate(n.id, {
                      onSuccess: () => toast.success("Number removed"),
                      onError: (e) =>
                        toast.error(e instanceof Error ? e.message : "Failed to remove"),
                    })
                  }
                  aria-label="Remove number"
                >
                  <Trash2 size={15} strokeWidth={2} />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* One-time code callout after registering, until the number verifies. */}
        {pendingCode && pendingCode.verificationCode && (
          <div className="mb-3.5 rounded-[12px] border border-[#FDE68A] bg-warning-bg px-4 py-3.5">
            <p className="text-sm font-semibold text-heading">Link {pendingCode.number.phoneE164}</p>
            <p className="text-xs text-text-secondary mt-1 leading-[1.55]">
              Send this code from that phone to our WhatsApp number:
            </p>
            <p className="text-lg font-bold font-mono text-heading my-1.5 tracking-wide">
              {pendingCode.verificationCode}
            </p>
            {pendingCode.waLink && (
              <Button
                size="sm"
                nativeButton={false}
                render={<a href={pendingCode.waLink} target="_blank" rel="noopener noreferrer" />}
              >
                <ExternalLink size={14} strokeWidth={2} />
                Open WhatsApp
              </Button>
            )}
          </div>
        )}

        {atLimit ? (
          <p className="text-xs text-text-secondary">
            You&apos;ve reached your plan&apos;s limit of {maxWhatsAppNumbers}{" "}
            {maxWhatsAppNumbers === 1 ? "number" : "numbers"}.
          </p>
        ) : (
          <div className="flex items-center gap-2.5">
            <Input
              type="tel"
              inputMode="tel"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && phone.trim()) add()
              }}
              className="h-auto py-[7px] px-2.5 max-w-[220px] rounded border-border text-sm"
            />
            <Button onClick={add} disabled={!phone.trim() || register.isPending}>
              {register.isPending ? "Adding…" : "Add number"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
