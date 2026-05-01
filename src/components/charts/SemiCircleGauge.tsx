'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface SemiCircleGaugeProps {
  emDia: number;
  proximoVencimento: number;
  vencido: number;
  title?: string;
  showLegend?: boolean;
}

const COLORS = {
  success: '#10b981', // Em dia
  warning: '#f59e0b', // Próximo ao vencimento
  danger: '#ef4444', // Vencido/Cancelado
};

export function SemiCircleGauge({
  emDia,
  proximoVencimento,
  vencido,
  title,
  showLegend = true,
}: SemiCircleGaugeProps) {
  const data = [
    { name: 'Em dia', value: emDia, color: COLORS.success },
    { name: 'Próximo vencimento', value: proximoVencimento, color: COLORS.warning },
    { name: 'Vencido/Cancelado', value: vencido, color: COLORS.danger },
  ].filter(item => item.value > 0);

  const total = emDia + proximoVencimento + vencido;

  // Calculate percentages for labels
  const emDiaPercent = total > 0 ? Math.round((emDia / total) * 100) : 0;
  const proximoPercent = total > 0 ? Math.round((proximoVencimento / total) * 100) : 0;
  const vencidoPercent = total > 0 ? Math.round((vencido / total) * 100) : 0;

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)] mb-4 text-center">
          {title}
        </h3>
      )}

      {/* Semi-circle gauge */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="100%"
              startAngle={180}
              endAngle={0}
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center pointer-events-none">
          <span className="text-2xl font-bold text-[var(--text-primary)]">{total}</span>
          <br />
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">total</span>
        </div>
      </div>

      {/* Legend - centered below the semi-circle */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.success }} />
            <div className="text-center">
              <span className="text-sm font-semibold text-[var(--text-primary)] block">
                {emDia}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Em dia ({emDiaPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.warning }} />
            <div className="text-center">
              <span className="text-sm font-semibold text-[var(--text-primary)] block">
                {proximoVencimento}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Próximo ({proximoPercent}%)</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.danger }} />
            <div className="text-center">
              <span className="text-sm font-semibold text-[var(--text-primary)] block">
                {vencido}
              </span>
              <span className="text-xs text-[var(--text-muted)]">Vencido ({vencidoPercent}%)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
