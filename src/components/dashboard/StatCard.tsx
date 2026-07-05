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
          <span className="text-[12.5px] font-[600] text-text-secondary leading-tight">{label}</span>
          <div
            className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center shrink-0 text-white"
            style={{ background: iconBg }}
          >
            {icon}
          </div>
        </div>
        <p className="text-[28px] font-[800] text-heading leading-none tracking-tight mt-2">{value}</p>
        <p className="text-[12px] font-[600] mt-[6px] leading-none" style={{ color: deltaColor }}>{delta}</p>
      </CardContent>
    </Card>
  )
}
