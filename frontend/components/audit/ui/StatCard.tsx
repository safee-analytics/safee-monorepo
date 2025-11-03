import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive?: boolean
  }
  iconBgColor?: string
  iconColor?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  iconBgColor = 'bg-blue-100',
  iconColor = 'text-blue-600',
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className={cn(
              "text-sm",
              trend?.positive === false ? "text-red-600" : "text-gray-500"
            )}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
          iconBgColor
        )}>
          <Icon className={cn("w-6 h-6", iconColor)} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium",
            trend.positive ? "text-green-600" : "text-red-600"
          )}>
            {trend.value}
          </span>
        </div>
      )}
    </div>
  )
}
