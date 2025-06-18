"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from "recharts"
import { useIsMobile } from "@/components/ui/use-mobile"

export function Overview() {
  const isMobile = useIsMobile()
  const [chartHeight, setChartHeight] = useState(350)

  useEffect(() => {
    setChartHeight(isMobile ? 200 : 350)
  }, [isMobile])

  const data = [
    { name: "Jan", total: 2450 },
    { name: "Feb", total: 2100 },
    { name: "Mar", total: 2800 },
    { name: "Apr", total: 2600 },
    { name: "May", total: 3100 },
    { name: "Jun", total: 3300 }
  ]

  // For mobile, we'll show less data points
  const mobileData = isMobile ? data.slice(-4) : data

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Overview</CardTitle>
        <CardDescription>Monthly attendance statistics</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={chartHeight}>
            {isMobile ? (
              // Simplified mobile view with BarChart
              <BarChart data={mobileData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  cursor={{ fill: "transparent" }}
                />
                <Bar
                  dataKey="total"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            ) : (
              // Desktop view with LineChart
              <LineChart data={data}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                  activeDot={{
                    r: 8,
                    style: { fill: "hsl(var(--primary))" },
                  }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 