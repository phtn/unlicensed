import {Area, AreaChart, ResponsiveContainer} from 'recharts'

interface MiniChartProps {
  data: Record<string, number>[]
  color?: string
}

export default function MiniChart({data, color = '#3b82f6'}: MiniChartProps) {
  return (
    <ResponsiveContainer width='100%' height={40}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${color}`} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='5%' stopColor={color} stopOpacity={0.3} />
            <stop offset='95%' stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type='monotone'
          dataKey='value'
          stroke={color}
          fill={`url(#gradient-${color})`}
          strokeWidth={2}
          dot={false}
          animationDuration={1000}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
