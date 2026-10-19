"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

// Demo series for the starter dashboard. Replace with authorized project metrics.
const activity = [
  { day: "Mon", visits: 24 }, { day: "Tue", visits: 35 },
  { day: "Wed", visits: 29 }, { day: "Thu", visits: 48 },
  { day: "Fri", visits: 42 }, { day: "Sat", visits: 53 },
  { day: "Sun", visits: 61 },
];

export function DemoActivityChart() {
  return <ChartContainer config={{ visits: { label: "Activity", color: "var(--chart-1)" } }} className="h-64 w-full aspect-auto">
    <AreaChart data={activity} accessibilityLayer margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="day" tickLine={false} axisLine={false} />
      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
      <ChartTooltip content={<ChartTooltipContent />} />
      <Area dataKey="visits" type="monotone" stroke="var(--color-visits)" fill="var(--color-visits)" fillOpacity={0.18} />
    </AreaChart>
  </ChartContainer>;
}
