'use client'

interface ProgressBarProps {
  title?: string
  values: {
    label: string
    value: number
    color: string
  }[]
  total: number
  showPercentages?: boolean
}

export function ProgressBar({
  title,
  values,
  total,
  showPercentages = true
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-4">
          {title}
        </h3>
      )}

      {/* Progress bar container */}
      <div className="h-8 rounded-full overflow-hidden flex bg-[rgba(255,255,255,0.05)] border border-[var(--glass-border)]">
        {values.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          if (percentage === 0) return null

          return (
            <div
              key={index}
              className="h-full flex items-center justify-center transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: item.color,
                minWidth: percentage > 5 ? 'auto' : '0'
              }}
              title={`${item.label}: ${item.value} (${percentage.toFixed(1)}%)`}
            >
              {percentage > 15 && (
                <span className="text-xs font-bold text-white px-2 whitespace-nowrap">
                  {item.value}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend below */}
      {showPercentages && (
        <div className="flex flex-wrap justify-center gap-4 mt-3">
          {values.filter(v => v.value > 0).map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0'
            return (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  {item.label}
                </span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  {item.value} ({percentage}%)
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Preset for DCTFWeb status
export function DCTFWebProgressBar({
  entregue,
  naoEntregue,
  inconsistencia,
  emProcessamento,
  outros
}: {
  entregue: number
  naoEntregue: number
  inconsistencia: number
  emProcessamento: number
  outros: number
}) {
  const COLORS = {
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    muted: '#6b7280'
  }

  const values = [
    { label: 'Entregue', value: entregue, color: COLORS.success },
    { label: 'Não Entregue', value: naoEntregue, color: COLORS.danger },
    { label: 'Inconsistência', value: inconsistencia, color: COLORS.warning },
    { label: 'Em Processamento', value: emProcessamento, color: COLORS.info },
    { label: 'Outros', value: outros, color: COLORS.muted }
  ]

  const total = entregue + naoEntregue + inconsistencia + emProcessamento + outros

  return (
    <ProgressBar
      title="DCTFWeb - Situação de Transmisão"
      values={values}
      total={total}
    />
  )
}
