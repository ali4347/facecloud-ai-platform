import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export interface ReasonDatum { name: string; value: number; color: string }

interface RejectionReasonChartProps {
  data: ReasonDatum[]
}

/** A donut of rejection reasons. Values are counts; the tooltip also gives each one's share of the reasons recorded. */
export function RejectionReasonChart({ data }: RejectionReasonChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (data.length === 0) {
    return <div className="h-[280px] flex items-center justify-center text-xs text-ink-mute">No rejection reasons recorded in this period.</div>
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={65} outerRadius={100} paddingAngle={3} dataKey="value">
          {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'rgb(var(--a-surface))',
            border: '1px solid rgb(var(--a-line))',
            borderRadius: '12px',
            fontSize: '12px',
            color: 'rgb(var(--a-ink))',
          }}
          formatter={(value, name) => [`${value} (${total ? Math.round((Number(value) / total) * 100) : 0}%)`, String(name)]}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: 'rgb(var(--a-ink-mute))', fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
