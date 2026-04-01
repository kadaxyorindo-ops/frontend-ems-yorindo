import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen bg-slate-50 overflow-x-hidden">
      
      {/* Isolated Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col w-full">
        
        {/* Isolated Topbar Component */}
        <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="mx-auto min-h-[500px] max-w-[88rem] rounded-xl border-2 border-dashed border-slate-300 bg-white p-5 shadow-sm md:p-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
