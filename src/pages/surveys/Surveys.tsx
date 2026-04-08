import { BarChart2 } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export function Surveys() {
  return (
    <DashboardLayout>
      <div className="space-y-6 flex flex-col h-full">
        <div className="mb-6 pb-2 border-b border-dashed border-slate-200">
          <h1 className="text-3xl font-bold">Surveys & Analytics</h1>
          <p className="text-gray-500">View survey results and event analytics reports.</p>
        </div>

        <div className="flex-1 w-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-3">
          <BarChart2 className="h-10 w-10 text-slate-300" />
          <p className="text-slate-400 font-mono text-sm">This module is coming soon.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
