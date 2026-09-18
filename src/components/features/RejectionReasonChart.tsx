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
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.45)',
          }}
          formatter={(value) => [`${value}%`, 'Share']}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.52)', fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
