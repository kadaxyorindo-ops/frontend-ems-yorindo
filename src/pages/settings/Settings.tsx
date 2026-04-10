import { DashboardLayout } from "@/layouts/DashboardLayout";

export function Settings() {
  return (
    <DashboardLayout>
      <title>Yorindo EMS - Settings</title>
      <div className="space-y-6 flex flex-col h-full">
        <div className="mb-6 pb-2 border-b border-dashed border-slate-200">
          <h1 className="text-4xl font-bold tracking-tight text-[#001a4e]">Settings</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">Configure your organizer profile and preferences.</p>
        </div>
        
        {/* Large blank square wireframe */}
        <div className="flex-1 w-full min-h-[400px] border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex items-center justify-center">
          <span className="text-slate-400 font-mono">[Settings Configuration Placeholder]</span>
        </div>
      </div>
    </DashboardLayout>
  );
}