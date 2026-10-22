"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const DemoActivityChart = dynamic(
  () =>
    import("@/components/layout/demo-activity-chart").then(
      (module) => module.DemoActivityChart,
    ),
  {
    ssr: false,
    loading: () => (
      <Skeleton className="h-64 w-full" aria-label="Loading activity chart" />
    ),
  },
);

export function ActivityChartPanel() {
  return <DemoActivityChart />;
}
