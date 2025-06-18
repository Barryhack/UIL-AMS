import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card } from "@/components/ui/card"

type ChartType = "area" | "bar"

interface ChartProps {
  data: any[]
  dataKey: string
  type?: ChartType
  height?: number
  showTooltip?: boolean
  showAxis?: boolean
  gradient?: boolean
  animated?: boolean
}

export function Chart({ 
  data, 
  dataKey, 
  type = "area",
  height = 350,
  showTooltip = true,
  showAxis = true,
  gradient = true,
  animated = true
}: ChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-2 border shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{label}</p>
            <p className="text-sm text-primary">
              {payload[0].value.toLocaleString()}%
            </p>
          </div>
        </Card>
      )
    }
    return null
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          {showAxis && (
            <>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                padding={{ left: 10, right: 10 }}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
                width={40}
                domain={[0, 100]}
              />
            </>
          )}
          {showTooltip && (
            <Tooltip
              content={<CustomTooltip />}
              cursor={false}
            />
          )}
          <defs>
            {gradient && (
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            )}
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill={gradient ? "url(#gradient)" : "none"}
            isAnimationActive={animated}
            animationDuration={1000}
            animationBegin={0}
            dot={{
              stroke: "hsl(var(--primary))",
              strokeWidth: 2,
              fill: "hsl(var(--background))",
              r: 4,
            }}
            activeDot={{
              stroke: "hsl(var(--primary))",
              strokeWidth: 2,
              fill: "hsl(var(--primary))",
              r: 6,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart 
        data={data} 
        margin={{ top: 20, right: 25, left: 5, bottom: 65 }}
        barSize={32}
      >
        {showAxis && (
          <>
            <XAxis
              dataKey="name"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              padding={{ left: 20, right: 20 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={60}
              dy={25}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              width={45}
              domain={[0, 100]}
              dx={-5}
            />
          </>
        )}
        {showTooltip && (
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "hsl(var(--muted))" }}
            wrapperStyle={{ zIndex: 1000 }}
          />
        )}
        <Bar
          dataKey={dataKey}
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          isAnimationActive={animated}
          animationDuration={1000}
          animationBegin={0}
        />
      </BarChart>
    </ResponsiveContainer>
  )
} 