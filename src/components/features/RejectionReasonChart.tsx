import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { rejectionReasonsData } from '../../data/mock'

interface RejectionReasonChartProps {
  data?: typeof rejectionReasonsData
}

export function RejectionReasonChart({ data = rejectionReasonsData }: RejectionReasonChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry: any, i: number) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(15,23,42,0.08)',
          }}
          formatter={(value) => [`${value}%`, 'Share']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: '#64748B', fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
