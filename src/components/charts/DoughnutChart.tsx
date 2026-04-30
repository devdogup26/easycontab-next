'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface DoughnutChartProps {
  data: {
    name: string
    value: number
    color: string
  }[]
  title?: string
  showLegend?: boolean
  showLabels?: boolean
  centerLabel?: string
  centerValue?: string
}

const COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444'
}

export function DoughnutChart({
  data,
  title,
  showLegend = true,
  showLabels = true,
  centerLabel,
  centerValue
}: DoughnutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-4">
          {title}
        </h3>
      )}
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius)',
                backdropFilter: 'blur(20px)',
                boxShadow: 'var(--shadow-glass)'
              }}
              itemStyle={{ color: 'var(--text-primary)' }}
              formatter={(value: number, name: string) => [
                `${value} (${((value / total) * 100).toFixed(1)}%)`,
                name
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center text */}
        {centerLabel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {centerValue}
              </span>
            )}
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              {centerLabel}
            </span>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                {item.name}
              </span>
              <span className="text-sm font-semibold text-[var(--text-primary)]">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Preset for Fiscal Situation
export function FiscalSituationChart({
  regular,
  regularizado,
  irregular
}: {
  regular: number
  regularizado: number
  irregular: number
}) {
  const data = [
    { name: 'Regular', value: regular, color: COLORS.success },
    { name: 'Regularizado', value: regularizado, color: COLORS.warning },
    { name: 'Irregular', value: irregular, color: COLORS.danger }
  ]

  const total = regular + regularizado + irregular

  return (
    <DoughnutChart
      data={data}
      title="Situação Fiscal Federal"
      centerLabel="clientes"
      centerValue={total.toString()}
      showLabels={true}
    />
  )
}
