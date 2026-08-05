import { Card, CardContent } from "@/components/ui/card"

interface StatCardProps {
  label: string
  value: number
  delta: string
  deltaColor: string
  iconBg: string
  icon: React.ReactNode
}

export function StatCard({ label, value, delta, deltaColor, iconBg, icon }: StatCardProps) {
  return (
    <Card className="ring-0 border border-border bg-surface shadow-none rounded-[14px] [--card-spacing:0]">
      <CardContent className="p-[18px]">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-semibold text-text-secondary leading-tight">{label}</span>
          <div
            className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0 text-white"
            style={{ background: iconBg }}
          >
            {icon}
          </div>
        </div>
        <p className="text-3xl font-extrabold text-heading leading-none tracking-tight mt-2">{value}</p>
        <p className="text-xs font-semibold mt-1.5 leading-none" style={{ color: deltaColor }}>{delta}</p>
      </CardContent>
    </Card>
  )
}
